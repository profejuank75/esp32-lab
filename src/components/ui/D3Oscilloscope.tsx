import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SignalSample } from '../../services/circuitSimulator';
import { PinDefinition } from '../../types/esp32';

interface D3OscilloscopeProps {
  selectedPin: PinDefinition;
  waveform: SignalSample[];
  currentVoltage: number;
}

export const D3Oscilloscope: React.FC<D3OscilloscopeProps> = ({
  selectedPin,
  waveform,
  currentVoltage,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [timeDiv, setTimeDiv] = useState<number>(50); // ms/div
  const [voltsDiv, setVoltsDiv] = useState<number>(1.0); // V/div
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Compute live waveform statistics
  const minV = waveform.length ? d3.min(waveform, (d) => d.voltage) ?? 0 : 0;
  const maxV = waveform.length ? d3.max(waveform, (d) => d.voltage) ?? 0 : 0;
  const vpp = Number((maxV - minV).toFixed(2));
  const avgV = waveform.length ? d3.mean(waveform, (d) => d.voltage) ?? 0 : 0;

  useEffect(() => {
    if (!svgRef.current || isPaused) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 320;
    const height = svgRef.current.clientHeight || 140;
    const margin = { top: 12, right: 12, bottom: 20, left: 32 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous drawing
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid definition (Oscilloscope division marks)
    const numXDivs = 8;
    const numYDivs = 4;

    // Draw background reticle
    for (let i = 0; i <= numXDivs; i++) {
      const x = (innerWidth / numXDivs) * i;
      g.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', innerHeight)
        .attr('stroke', i === numXDivs / 2 ? '#334155' : '#1e293b')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', i === numXDivs / 2 ? 'none' : '2,2');
    }

    for (let j = 0; j <= numYDivs; j++) {
      const y = (innerHeight / numYDivs) * j;
      g.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', innerWidth)
        .attr('y2', y)
        .attr('stroke', j === numYDivs / 2 ? '#334155' : '#1e293b')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', j === numYDivs / 2 ? 'none' : '2,2');
    }

    // Scales
    const maxScaleV = voltsDiv * 4; // 4 vertical divisions
    const xScale = d3
      .scaleLinear()
      .domain([0, waveform.length - 1 || 1])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxScaleV])
      .range([innerHeight, 0]);

    // Axes
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => `${d}V`);

    g.append('g')
      .attr('class', 'text-[10px] text-slate-400 font-mono')
      .call(yAxis)
      .select('.domain')
      .attr('stroke', '#334155');

    g.selectAll('.tick line').attr('stroke', '#334155');
    g.selectAll('.tick text').attr('fill', '#94a3b8');

    // Gradient for signal glow
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'signalGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    const traceColor =
      selectedPin.id === 33
        ? '#38bdf8' // Blue for GPIO2 LED
        : selectedPin.id === 5
        ? '#f59e0b' // Amber for LDR
        : selectedPin.primaryType === 'POWER'
        ? '#ef4444' // Red for 3.3V/5V
        : '#10b981'; // Emerald for general I2C/GPIO

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', traceColor)
      .attr('stop-opacity', 0.25);
    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', traceColor)
      .attr('stop-opacity', 0.0);

    if (waveform.length > 1) {
      // Area under curve
      const area = d3
        .area<SignalSample>()
        .x((_, i) => xScale(i))
        .y0(innerHeight)
        .y1((d) => yScale(Math.max(0, Math.min(maxScaleV, d.voltage))))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(waveform)
        .attr('fill', 'url(#signalGradient)')
        .attr('d', area);

      // Main line trace
      const line = d3
        .line<SignalSample>()
        .x((_, i) => xScale(i))
        .y((d) => yScale(Math.max(0, Math.min(maxScaleV, d.voltage))))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(waveform)
        .attr('fill', 'none')
        .attr('stroke', traceColor)
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('d', line);

      // Latest point marker
      const latestX = xScale(waveform.length - 1);
      const latestY = yScale(Math.max(0, Math.min(maxScaleV, waveform[waveform.length - 1].voltage)));

      g.append('circle')
        .attr('cx', latestX)
        .attr('cy', latestY)
        .attr('r', 3.5)
        .attr('fill', '#ffffff')
        .attr('stroke', traceColor)
        .attr('stroke-width', 2);
    }
  }, [waveform, voltsDiv, timeDiv, selectedPin, isPaused]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 shadow-2xl backdrop-blur-md">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Osciloscopio D3 · Pin {selectedPin.label}
          </span>
          {selectedPin.gpio !== undefined && (
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
              GPIO{selectedPin.gpio}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800 text-emerald-400 font-semibold tabular-nums">
            <span className="text-[10px] text-slate-500">V_ACT:</span>
            <span>{currentVoltage.toFixed(2)} V</span>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors font-medium ${
              isPaused
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>
        </div>
      </div>

      {/* SVG Scope Screen */}
      <div className="relative w-full h-32 bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* On-screen telemetry readout */}
        <div className="absolute top-1.5 right-2 flex items-center gap-2.5 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none tabular-nums">
          <span>Vpp: <strong className="text-slate-200">{vpp}V</strong></span>
          <span>Vprom: <strong className="text-slate-200">{avgV.toFixed(2)}V</strong></span>
        </div>
      </div>

      {/* Controls & scale knobs */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[11px]">Escala V:</span>
            <select
              value={voltsDiv}
              onChange={(e) => setVoltsDiv(Number(e.target.value))}
              aria-label="Escala vertical de voltaje"
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-200 font-mono"
            >
              <option value={0.5}>0.5 V/div</option>
              <option value={1.0}>1.0 V/div</option>
              <option value={1.5}>1.5 V/div</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px]">Base Tiempo:</span>
            <select
              value={timeDiv}
              onChange={(e) => setTimeDiv(Number(e.target.value))}
              aria-label="Base de tiempo horizontal"
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-200 font-mono"
            >
              <option value={20}>20 ms/div</option>
              <option value={50}>50 ms/div</option>
              <option value={100}>100 ms/div</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
          {selectedPin.description}
        </div>
      </div>
    </div>
  );
};
