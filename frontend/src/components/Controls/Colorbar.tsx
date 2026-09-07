/**
 * Colorbar component — shows the color scale legend for the current variable.
 * Renders as an overlay on the 3D viewport.
 */
import { useMemo } from 'react';
import { getColormap, type ColorStop } from '../../utils/colormap';
import { VARIABLE_LABELS, VARIABLE_UNITS, type OceanVariable } from '../../types';
import './Colorbar.css';

interface ColorbarProps {
  variable: OceanVariable;
  vMin: number;
  vMax: number;
}

export default function Colorbar({ variable, vMin, vMax }: ColorbarProps) {
  const colormap = useMemo(() => getColormap(variable), [variable]);

  // Generate CSS gradient from colormap
  const gradientStyle = useMemo(() => {
    const stops = colormap.map((stop: ColorStop) => {
      const [r, g, b] = stop.color;
      return `rgb(${r},${g},${b}) ${stop.position * 100}%`;
    });
    return {
      background: `linear-gradient(to right, ${stops.join(', ')})`,
    };
  }, [colormap]);

  const label = VARIABLE_LABELS[variable] || variable;
  const unit = VARIABLE_UNITS[variable] || '';

  // Generate tick values
  const ticks = useMemo(() => {
    const count = 5;
    const result: { value: string; position: string }[] = [];
    for (let i = 0; i <= count; i++) {
      const val = vMin + (vMax - vMin) * (i / count);
      result.push({
        value: val.toFixed(1),
        position: `${(i / count) * 100}%`,
      });
    }
    return result;
  }, [vMin, vMax]);

  return (
    <div className="colorbar">
      <div className="colorbar-label">
        {label} ({unit})
      </div>
      <div className="colorbar-gradient" style={gradientStyle} />
      <div className="colorbar-ticks">
        {ticks.map((tick, i) => (
          <span
            key={i}
            className="colorbar-tick"
            style={{ left: tick.position }}
          >
            {tick.value}
          </span>
        ))}
      </div>
    </div>
  );
}
