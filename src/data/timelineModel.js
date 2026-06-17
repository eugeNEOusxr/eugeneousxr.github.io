/**
 * Adapter shim: delegates to canonical `src/wordweaver/timelineModel.js`.
 *
 * Legacy key `inkling:wordweaver-timeline-v1` may still hold data until importers
 * are fully on the canonical store (`inkling-timeline-v1`). Import runs once when
 * the canonical store is empty — see `importLegacyWordweaverStoreIfNeeded`.
 *
 * Do not delete this module until TimelineRenderer + InklingChatBridge are verified
 * on the canonical path alone.
 */

import {
  initTimelineModel,
  importLegacyWordweaverStoreIfNeeded,
  loadTimeline as loadCanonicalTimeline,
  saveTimeline as saveCanonicalTimeline,
  addTimelineEntry,
  updateTimelineEntry
} from "../wordweaver/timelineModel.js";

export const DEFAULT_TIMELINE_FORMAT = {
  fontSize: 0.26,
  fontWeight: "700",
  color: "#e2e8f0"
};

/** @typedef {{
 *   id: number | string,
 *   time: string,
 *   text: string,
 *   fontSize: number,
 *   fontWeight: string,
 *   color: string
 * }} TimelineEntryRecord */

/**
 * @param {import("../wordweaver/timelineModel.js").TimelineEntryRecord} entry
 * @returns {TimelineEntryRecord}
 */
function toDataEntryShape(entry) {
  return {
    id: entry.id,
    time: entry.time,
    text: entry.text,
    fontSize: entry.fontSize ?? DEFAULT_TIMELINE_FORMAT.fontSize,
    fontWeight: entry.weight === "bold" ? "700" : "600",
    color: entry.color ?? DEFAULT_TIMELINE_FORMAT.color
  };
}

/**
 * @param {Partial<TimelineEntryRecord> & { time?: string, text?: string }} raw
 * @param {number} id
 * @returns {TimelineEntryRecord}
 */
export function normalizeEntry(raw, id) {
  return {
    id: Number.isFinite(raw.id) ? Number(raw.id) : id,
    time: String(raw.time ?? "09:00"),
    text: String(raw.text ?? "").trim(),
    fontSize: Number(raw.fontSize) || DEFAULT_TIMELINE_FORMAT.fontSize,
    fontWeight: String(raw.fontWeight ?? DEFAULT_TIMELINE_FORMAT.fontWeight),
    color: String(raw.color ?? DEFAULT_TIMELINE_FORMAT.color)
  };
}

function bootCanonical() {
  initTimelineModel();
  importLegacyWordweaverStoreIfNeeded();
}

/**
 * @returns {TimelineEntryRecord[]}
 */
export function loadTimeline() {
  bootCanonical();
  return loadCanonicalTimeline().map(toDataEntryShape);
}

/**
 * @returns {Promise<TimelineEntryRecord[]>}
 */
export async function ensureTimelineSeeded() {
  bootCanonical();
  return loadTimeline();
}

/**
 * @param {TimelineEntryRecord[]} entries
 */
export function saveTimeline(entries) {
  bootCanonical();
  const canonical = entries.map((entry, index) => {
    const n = normalizeEntry(entry, entry.id ?? index + 1);
    return {
      id: String(n.id),
      time: n.time,
      text: n.text,
      fontSize: n.fontSize,
      weight: n.fontWeight === "700" || n.fontWeight === "800" ? "bold" : "normal",
      color: n.color,
      label: "Note"
    };
  });
  saveCanonicalTimeline(canonical);
  return loadTimeline();
}

/**
 * @param {string} time HH:MM
 * @param {string} text
 * @param {Partial<Pick<TimelineEntryRecord, "fontSize"|"fontWeight"|"color">>} [formatting]
 * @returns {TimelineEntryRecord}
 */
export function addEntry(time, text, formatting = {}) {
  bootCanonical();
  const entry = addTimelineEntry({
    time,
    text,
    fontSize: formatting.fontSize,
    color: formatting.color,
    weight:
      formatting.fontWeight === "700" || formatting.fontWeight === "800" ? "bold" : "normal"
  });
  return toDataEntryShape(entry);
}

/**
 * @param {number | string} id
 * @param {Partial<TimelineEntryRecord>} fields
 * @returns {TimelineEntryRecord | null}
 */
export function updateEntry(id, fields) {
  bootCanonical();
  const canonicalId = String(id);
  const updated = updateTimelineEntry(canonicalId, {
    time: fields.time,
    text: fields.text,
    fontSize: fields.fontSize,
    color: fields.color,
    weight:
      fields.fontWeight === "700" || fields.fontWeight === "800" ? "bold" : "normal"
  });
  return updated ? toDataEntryShape(updated) : null;
}
