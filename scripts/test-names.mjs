import { createHash } from "node:crypto";

// Nazwa widoczna w aplikacji jest krótka; pełne REG_* pozostaje w rejestrze i e-mailu.
export function shortTestToken(identity) {
  if (typeof identity !== "string" || !identity.trim())
    throw new Error("Brak tożsamości danych testowych.");
  return createHash("sha256").update(identity.toLowerCase()).digest("hex").slice(0, 12);
}

export function automaticTeacherName(identity) {
  return `AUTO_${shortTestToken(identity)}`;
}

export function automaticSchoolPrefix(family, environment) {
  if (!/^[A-Z]{2,4}$/.test(family) || !["dev", "test"].includes(environment))
    throw new Error("Niepoprawny obszar lub środowisko szkoły testowej.");
  return `AUTO_${family}_${environment === "dev" ? "D" : "T"}_`;
}

export function automaticSchoolName(family, role, environment, scope = "") {
  if (!/^[A-Z0-9_-]{0,12}$/.test(role)) throw new Error("Niepoprawna rola szkoły testowej.");
  if (!role && !scope) throw new Error("Szkoła testowa wymaga roli lub identyfikatora.");
  const name =
    automaticSchoolPrefix(family, environment) +
    role +
    (scope ? `${role ? "_" : ""}${shortTestToken(scope)}` : "");
  if (name.length > 32) throw new Error("Nazwa szkoły testowej może mieć najwyżej 32 znaki.");
  return name;
}

export function automaticCategorySchoolName(key, environment) {
  const prefix = automaticSchoolPrefix("CAT", environment);
  if (typeof key !== "string" || !key) throw new Error("Brak klucza szkoły kategorii.");
  // Osobne znaczniki utrzymują wąskie kontrole własności danych bez flagi Testowy.
  if (/^ENT_UNMARKED_.*_POTW26_/.test(key)) return prefix + "P26_" + shortTestToken(key);
  if (/^ENT_UNMARKED_PROMO_NCL_04_/.test(key)) return prefix + "NCL4_" + shortTestToken(key);
  if (key.startsWith("ENT_UNMARKED_")) return prefix + "EU_" + shortTestToken(key);
  if (key.startsWith("ENT_")) return prefix + "ENT_" + shortTestToken(key);
  if (/^[A-Z0-9_]{1,12}$/.test(key)) return prefix + key;
  return prefix + "X_" + shortTestToken(key);
}

export function entitlementSchoolPattern(environment, unmarked = false) {
  const prefix = automaticSchoolPrefix("CAT", environment);
  return new RegExp(
    `^(?:AUTO_CAT_${environment.toUpperCase()}_ENT_${unmarked ? "UNMARKED_" : ""}|${prefix}(?:${unmarked ? "EU|P26|NCL4" : "ENT|EU|P26|NCL4"})_[a-f0-9]{12}$)`,
  );
}

export function isAutomaticRecordName(name) {
  return /^(?:AUTO_|AUTOMAT CLUB |REG_)/i.test(name);
}

export function isPackageOrderSchool(name) {
  return /^(?:AUTO_CAT_DEV_ENT_UNMARKED_(?:SP|TECH)_(?:400|8|MISSING)_(?:PRIMARY|SECOND)_POTW26_[a-f0-9]{12}_P\d+_W\d+|AUTO_CAT_D_P26_[a-f0-9]{12})$/.test(
    name,
  );
}

export function isNewClientHistorySchool(name) {
  return /^AUTO_CAT_D_NCL4_[a-f0-9]{12}$/.test(name);
}
