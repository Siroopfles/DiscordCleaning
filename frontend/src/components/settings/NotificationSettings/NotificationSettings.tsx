import { FC } from 'react';
import { SettingToggle } from '../SettingToggle';
import { SettingSelect } from '../SettingSelect';
import { IUserSettings } from '../../../types/models';
import styles from './NotificationSettings.module.css';

interface NotificationSettingsProps {
  settings: IUserSettings['notifications'];
  onUpdate: (settings: IUserSettings['notifications']) => void;
}

const frequencyOptions = [
  { value: 'realtime', label: 'Direct' },
  { value: 'hourly', label: 'Elk uur' },
  { value: 'daily', label: 'Dagelijks' },
];

export const NotificationSettings: FC<NotificationSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  const handleToggleUpdate = (key: keyof Omit<IUserSettings['notifications'], 'frequency'>) => (value: boolean) => {
    onUpdate({
      ...settings,
      [key]: value,
    });
  };

  const handleFrequencyUpdate = (value: string) => {
    onUpdate({
      ...settings,
      frequency: value as IUserSettings['notifications']['frequency'],
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Notificatie-instellingen</h2>
      
      <SettingToggle
        label="Email notificaties"
        description="Ontvang meldingen via email"
        checked={settings.email}
        onChange={handleToggleUpdate('email')}
      />
      
      <SettingToggle
        label="Discord notificaties"
        description="Ontvang meldingen via Discord"
        checked={settings.discord}
        onChange={handleToggleUpdate('discord')}
      />
      
      <SettingToggle
        label="Desktop notificaties"
        description="Ontvang meldingen in je browser"
        checked={settings.desktop}
        onChange={handleToggleUpdate('desktop')}
      />
      
      <SettingSelect
        label="Notificatie frequentie"
        description="Hoe vaak wil je notificaties ontvangen?"
        value={settings.frequency}
        options={frequencyOptions}
        onChange={handleFrequencyUpdate}
      />
    </div>
  );
};