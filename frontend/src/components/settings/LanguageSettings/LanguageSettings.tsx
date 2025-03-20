import { FC } from 'react';
import { SettingSelect } from '../SettingSelect';
import { IUserSettings } from '../../../types/models';
import styles from './LanguageSettings.module.css';

interface LanguageSettingsProps {
  language: IUserSettings['language'];
  onUpdate: (language: IUserSettings['language']) => void;
}

const languageOptions = [
  { value: 'nl', label: 'Nederlands' },
  { value: 'en', label: 'English' },
];

export const LanguageSettings: FC<LanguageSettingsProps> = ({
  language,
  onUpdate,
}) => {
  const handleLanguageChange = (value: string) => {
    onUpdate(value as IUserSettings['language']);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Taalinstellingen</h2>
      
      <SettingSelect
        label="Taal"
        description="Kies je voorkeurstaal voor de interface"
        value={language}
        options={languageOptions}
        onChange={handleLanguageChange}
      />
      
      <p className={styles.note}>
        Let op: Het wijzigen van de taal zal de pagina automatisch herladen
      </p>
    </div>
  );
};