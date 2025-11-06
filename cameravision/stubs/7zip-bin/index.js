// Minimal safe API: return null paths so consumers can handle absence.
module.exports = {
  path7za: null,
  path7z: null,
  path: () => null,
  getPath: () => null,
  platform: process.platform,
  // helper for backwards compatibility
  get7zipPath: () => null
};