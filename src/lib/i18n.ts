"use client";

import * as React from "react";

export type Language = "id" | "en";

export const DICTIONARY = {
  id: {
    // Settings
    settingsTitle: "Pengaturan Workspace",
    settingsDesc: "Konfigurasi Standard Operating Procedure (SOP) & Preferensi",
    settingsSub:
      "Kelola preferensi kanvas swimlane, standar ekspor grafis, profil divisi, serta pilihan bahasa tampilan.",
    saveChanges: "Simpan Perubahan",
    savedSuccess: "Pengaturan berhasil disimpan!",
    accountInfo: "Informasi Akun & Tim",
    accountDesc:
      "Data ini digunakan sebagai PIC penanggung jawab dan identitas organisasi pada kop diagram.",
    fullName: "Nama Lengkap",
    accountEmail: "Email Akun",
    workspaceName: "Nama Workspace / Organisasi Aktif",
    editorPrefs: "Preferensi Editor",
    editorDesc:
      "Atur kenyamanan drag-and-drop, magnetis alur koneksi, serta interval penyimpanan otomatis.",
    languageSection: "Bahasa & Bahasa Tampilan (Bilingual)",
    languageDesc:
      "Pilih bahasa antarmuka aplikasi Zefflow (Mendukung Bahasa Indonesia dan Bahasa Inggris).",
    langId: "Bahasa Indonesia (Standar)",
    langEn: "English (US)",
    langChanged: "Bahasa berhasil diubah ke Bahasa Indonesia",
    tabProfile: "Profil & Organisasi",
    tabEditor: "Preferensi Editor",
    tabStandards: "Standar Notasi & Ekspor",
    tabApi: "Kunci API & Webhooks",
    tabLanguage: "Bahasa / Language",

    // Dashboard & Actions
    recentsTitle: "Recents & File Diagram",
    templatesTitle: "Pustaka Template Alur Kerja & Arsitektur",
    searchPlaceholder: "Cari file diagram atau SOP...",
    newSwimlane: "+ Swimlane SOP",
    newArchitect: "+ Studio 2: Architect",
    bulkSelect: "Pilih Banyak",
    bulkCancel: "Batalkan",
    bulkDelete: "Hapus Terpilih",
    bulkConfirm: "Hapus {count} diagram yang dipilih secara permanen?",
    bulkSuccess: "{count} diagram berhasil dihapus.",
    sopSectionTitle: "Template Swimlane & SOP Bisnis",
    architectSectionTitle: "Template Studio Architect & Database ERD",
    allTemplates: "Semua Template",
  },
  en: {
    // Settings
    settingsTitle: "Workspace Settings",
    settingsDesc: "Standard Operating Procedure (SOP) & Preferences Configuration",
    settingsSub:
      "Manage swimlane canvas preferences, graphic export standards, division profiles, and interface language.",
    saveChanges: "Save Changes",
    savedSuccess: "Settings saved successfully!",
    accountInfo: "Account & Team Information",
    accountDesc:
      "This information is used as the PIC owner and organization identity on diagram headers.",
    fullName: "Full Name",
    accountEmail: "Account Email",
    workspaceName: "Active Workspace / Organization Name",
    editorPrefs: "Editor Preferences",
    editorDesc:
      "Configure drag-and-drop behavior, magnetic snapping, and autosave intervals.",
    languageSection: "Language & Localization (Bilingual)",
    languageDesc:
      "Choose your preferred interface language (Supports English and Bahasa Indonesia).",
    langId: "Bahasa Indonesia (Indonesian)",
    langEn: "English (US - Default)",
    langChanged: "Language successfully changed to English",
    tabProfile: "Profile & Organization",
    tabEditor: "Editor Preferences",
    tabStandards: "Standards & Export",
    tabApi: "API Keys & Webhooks",
    tabLanguage: "Language / Bahasa",

    // Dashboard & Actions
    recentsTitle: "Recents & Diagram Files",
    templatesTitle: "Workflow & Architecture Template Library",
    searchPlaceholder: "Search diagrams or SOP files...",
    newSwimlane: "+ Swimlane SOP",
    newArchitect: "+ Studio 2: Architect",
    bulkSelect: "Bulk Select",
    bulkCancel: "Cancel",
    bulkDelete: "Delete Selected",
    bulkConfirm: "Permanently delete {count} selected diagram(s)?",
    bulkSuccess: "{count} diagram(s) deleted successfully.",
    sopSectionTitle: "Swimlane & Business SOP Templates",
    architectSectionTitle: "Studio Architect & Database ERD Templates",
    allTemplates: "All Templates",
  },
} as const;

const STORAGE_KEY = "zf_lang";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "id";
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === "en" ? "en" : "id";
  } catch {
    return "id";
  }
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent("zf_lang_change", { detail: lang }));
  } catch {
    // no-op
  }
}

export function useLanguage() {
  const [lang, setLangState] = React.useState<Language>("id");

  React.useEffect(() => {
    setLangState(getStoredLanguage());

    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<Language>;
      if (custom.detail) setLangState(custom.detail);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "id" || e.newValue === "en")) {
        setLangState(e.newValue);
      }
    };

    window.addEventListener("zf_lang_change", handleCustomChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("zf_lang_change", handleCustomChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const changeLang = React.useCallback((next: Language) => {
    setLangState(next);
    setStoredLanguage(next);
  }, []);

  const t = DICTIONARY[lang];

  return { lang, setLang: changeLang, t };
}
