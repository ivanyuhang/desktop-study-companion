import type { FocusSettings } from '../../../shared/models'
import Field from './FormField'
export default function FocusFields({
  value,
  onChange,
  disabled = false
}: {
  value: FocusSettings
  onChange: (value: FocusSettings) => void
  disabled?: boolean
}): React.JSX.Element {
  return (
    <div className="form-grid">
      {(
        [
          ['studyMinutes', 'Study minutes', 180],
          ['breakMinutes', 'Break minutes', 60],
          ['rounds', 'Study rounds', 12]
        ] as const
      ).map(([key, label, max]) => (
        <Field label={label} key={key}>
          <input
            type="number"
            min={1}
            max={max}
            step={1}
            required
            disabled={disabled}
            value={value[key] || ''}
            onChange={(e) => onChange({ ...value, [key]: +e.target.value })}
          />
        </Field>
      ))}
    </div>
  )
}
