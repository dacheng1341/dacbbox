import { get, set } from 'idb-keyval';

const KEY_PREFIX = 'game_dict_';

export const storage = {
  async load<T>(key: string, defaultVal: T): Promise<T> {
    try {
      const data = await get(`${KEY_PREFIX}${key}`);
      return data !== undefined ? data : defaultVal;
    } catch (e) {
      console.error(`Error loading ${key} from IDB:`, e);
      return defaultVal;
    }
  },

  async save<T>(key: string, value: T): Promise<void> {
    try {
      await set(`${KEY_PREFIX}${key}`, JSON.parse(JSON.stringify(value)));
    } catch (e) {
      console.error(`Error saving ${key} to IDB:`, e);
    }
  }
};
