import { FC } from 'react';
import { SettingToggle } from '../SettingToggle';
import { IUserSettings } from '../../../types/models';
import styles from './PrivacySettings.module.css';

interface PrivacySettingsProps {
  settings: IUserSettings['privacy'];
  onUpdate: (settings: IUserSettings['privacy']) => void;
}

export const PrivacySettings: FC<PrivacySettingsProps> = ({
  settings,
  onUpdate,
}) => {
  const handleToggleUpdate = (key: keyof IUserSettings['privacy']) => (value: boolean) => {
    onUpdate({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Privacy-instellingen</h2>
      
      <div className={styles.settingsGroup}>
        <SettingToggle
          label="Online status weergeven"
          description="Laat anderen zien wanneer je online bent"
          checked={settings.showOnline}
          onChange={handleToggleUpdate('showOnline')}
        />
        
        <SettingToggle
          label="Activiteit delen"
          description="Deel je taakvoortgang met teamleden"
          checked={settings.showActivity}
          onChange={handleToggleUpdate('showActivity')}
        />
        
        <SettingToggle
          label="Statistieken delen"
          description="Deel je prestaties op het leaderboard"
          checked={settings.shareStats}
          onChange={handleToggleUpdate('shareStats')}
        />
      </div>
      
      <p className={styles.privacyNote}>
        Je privacy is belangrijk voor ons. Deze instellingen bepalen welke informatie 
        zichtbaar is voor andere gebruikers van het platform.
      </p>
    </div>
  );
};