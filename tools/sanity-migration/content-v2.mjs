import {homepageDocument} from "./homepage.mjs";
import {managedComplianceDocument} from "./managed-compliance.mjs";
import {navigationDocument} from "./navigation.mjs";
import {siteSettingsDocument} from "./site-settings.mjs";

export const migrationVersion = "zebrabyte-site-v2-20260822";

export const migrationDocuments = [
  siteSettingsDocument,
  navigationDocument,
  homepageDocument,
  managedComplianceDocument,
];
