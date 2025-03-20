import { FC } from 'react';
import { SettingSelect } from '../SettingSelect';
import { IUserSettings } from '../../../types/models';
import styles from './ThemeSettings.module.css';

interface ThemeSettingsProps {
  settings: IUserSettings['theme'];
  onUpdate: (settings: IUserSettings['theme']) => void;
}

const themeOptions = [
  { value: 'light', label: 'Licht' },
  { value: 'dark', label: 'Donker' },
  { value: 'system', label: 'Systeem' },
];

const fontSizeOptions = [
  { value: 'small', label: 'Klein' },
  { value: 'medium', label: 'Normaal' },
  { value: 'large', label: 'Groot' },
];

const colorOptions = [
  { value: '#007AFF', label: 'Blauw' },
  { value: '#34C759', label: 'Groen' },
  { value: '#FF3B30', label: 'Rood' },
  { value: '#AF52DE', label: 'Paars' },
  { value: '#FF9500', label: 'Oranje' },
];

export const ThemeSettings: FC<ThemeSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  const handleSettingUpdate = (key: keyof IUserSettings['theme']) => (value: string) => {
    onUpdate({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Weergave-instellingen</h2>
      
      <SettingSelect
        label="Thema"
        description="Kies je voorkeursthema"
        value={settings.mode}
        options={themeOptions}
        onChange={handleSettingUpdate('mode')}
      />
      
      <div className={styles.colorSection}>
        <h3 className={styles.subheading}>Primaire kleur</h3>
        <div className={styles.colorGrid}>
          {colorOptions.map((option) => (
            <button
              key={option.value}
              className={`${styles.colorButton} ${
                settings.primaryColor === option.value ? styles.selected : ''
              }`}
              style={{ backgroundColor: option.value }}
              onClick={() => handleSettingUpdate('primaryColor')(option.value)}
              aria-label={`Kies ${option.label} als primaire kleur`}
            />
          ))}
        </div>
      </div>
      
      <SettingSelect
        label="Tekstgrootte"
        description="Pas de grootte van de tekst aan"
        value={settings.fontSize}
        options={fontSizeOptions}
        onChange={handleSettingUpdate('fontSize')}
      />
    </div>
  );
};