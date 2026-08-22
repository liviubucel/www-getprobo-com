export function localizedString(ro, en) {
  return {_type: "localizedString", ro, en};
}

export function localizedText(ro, en) {
  return {_type: "localizedText", ro, en};
}

export function cmsLink({labelRo, labelEn, href, style = "text", newTab = false, key}) {
  const value = {
    _type: "cmsLink",
    label: localizedString(labelRo, labelEn),
    href,
    style,
    newTab,
  };
  if (key) value._key = key;
  return value;
}

export function portableTextBlock(key, text) {
  return {
    _key: key,
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [
      {
        _key: `${key}-span`,
        _type: "span",
        text,
        marks: [],
      },
    ],
  };
}

export function localizedRichText(key, ro, en) {
  return {
    _type: "localizedRichText",
    ro: [portableTextBlock(`${key}-ro`, ro)],
    en: [portableTextBlock(`${key}-en`, en)],
  };
}

export function navItem(key, labelRo, labelEn, descriptionRo, descriptionEn, href, icon) {
  return {
    _key: key,
    _type: "navItem",
    label: localizedString(labelRo, labelEn),
    description: localizedString(descriptionRo, descriptionEn),
    href,
    icon,
  };
}

export function navFeature({
  eyebrowRo,
  eyebrowEn,
  titleRo,
  titleEn,
  href,
  legacyAssetPath,
  altRo,
  altEn,
  variant,
}) {
  return {
    eyebrow: localizedString(eyebrowRo, eyebrowEn),
    title: localizedString(titleRo, titleEn),
    href,
    legacyAssetPath,
    alt: localizedString(altRo, altEn),
    variant,
  };
}

export function footerGroup(key, titleRo, titleEn, items) {
  return {
    _key: key,
    _type: "footerGroup",
    title: localizedString(titleRo, titleEn),
    items,
  };
}
