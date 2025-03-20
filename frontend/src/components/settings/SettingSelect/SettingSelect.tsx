import { FC } from 'react';
import styles from './SettingSelect.module.css';

interface Option {
  value: string;
  label: string;
}

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SettingSelect: FC<SettingSelectProps> = ({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.textContent}>
        <label htmlFor={`select-${label}`} className={styles.label}>
          {label}
        </label>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <select
        id={`select-${label}`}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};