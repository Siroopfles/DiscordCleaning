import { FC } from 'react';
import { IUserSettings } from '../../../types/models';
import { NotificationSettings } from '../NotificationSettings/NotificationSettings';
import { ThemeSettings } from '../ThemeSettings/ThemeSettings';
import { LanguageSettings } from '../LanguageSettings/LanguageSettings';
import { PrivacySettings } from '../PrivacySettings/PrivacySettings';
import styles from './SettingsLayout.module.css';

interface SettingsLayoutProps {
  settings: IUserSettings;
  onUpdateSettings: (settings: Partial<IUserSettings>) => void;
}

export const SettingsLayout: FC<SettingsLayoutProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const handleNotificationUpdate = (notifications: IUserSettings['notifications']) => {
    onUpdateSettings({ notifications });
  };

  const handleThemeUpdate = (theme: IUserSettings['theme']) => {
    onUpdateSettings({ theme });
  };

  const handleLanguageUpdate = (language: IUserSettings['language']) => {
    onUpdateSettings({ language });
  };

  const handlePrivacyUpdate = (privacy: IUserSettings['privacy']) => {
    onUpdateSettings({ privacy });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Instellingen</h1>
        <p className={styles.description}>
          Pas je voorkeuren aan voor een persoonlijke ervaring
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.section}>
          <NotificationSettings
            settings={settings.notifications}
            onUpdate={handleNotificationUpdate}
          />
        </section>

        <section className={styles.section}>
          <ThemeSettings
            settings={settings.theme}
            onUpdate={handleThemeUpdate}
          />
        </section>

        <section className={styles.section}>
          <LanguageSettings
            language={settings.language}
            onUpdate={handleLanguageUpdate}
          />
        </section>

        <section className={styles.section}>
          <PrivacySettings
            settings={settings.privacy}
            onUpdate={handlePrivacyUpdate}
          />
        </section>
      </div>
    </div>
  );
};