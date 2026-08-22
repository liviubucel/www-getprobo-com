import {homepageDocument} from "./homepage.mjs";
import {navigationDocument} from "./navigation.mjs";
import {siteSettingsDocument} from "./site-settings.mjs";

export const migrationVersion = "zebrabyte-site-v1-20260822";

export const migrationDocuments = [
  siteSettingsDocument,
  navigationDocument,
  homepageDocument,
];
