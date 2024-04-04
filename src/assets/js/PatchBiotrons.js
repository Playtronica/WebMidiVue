

export class BiotronDb {
    DB_NAME = "Playtronica_WebMIDI_db"
    STORE_NAME = "Biotron_Patches"
    VERSION = 5

    DEFAULT = {
        "name": "Default Patch Biotron",
        "editable": false,
        "saved": true,
        "data": {
            "commands": [
                {
                    "name": "plantBpm",
                    "value": 60
                },
                {
                    "name": "lightBpm",
                    "value": 4
                },
                {
                    "name": "noteOffPercent",
                    "value": 100
                },
                {
                    "name": "noteDistance",
                    "value": 50
                },
                {
                    "name": "firstValue",
                    "value": 10
                },
                {
                    "name": "smoothness",
                    "value": 0
                },
                {
                    "name": "scale",
                    "value": 0
                },
                {
                    "name": "minPlantVelocity",
                    "value": 74
                },
                {
                    "name": "maxPlantVelocity",
                    "value": 75
                },
                {
                    "name": "minLightVelocity",
                    "value": 74
                },
                {
                    "name": "maxLightVelocity",
                    "value": 75
                },
                {
                    "name": "randomness",
                    "value": 0
                },
                {
                    "name": "same_note",
                    "value": 0
                },
                {
                    "name": "min_range_light_note",
                    "value": 24
                },
                {
                    "name": "max_range_light_note",
                    "value": 48
                }
            ],
            "extra": {
                "plant_humanize": false,
                "light_humanize": false,
                "plant_mute": false,
                "light_mute": false
            }
        }
    }

    constructor() {
        const indexedDB =
            window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB ||
            window.shimIndexedDB;

        if (!indexedDB) {
            console.log("IndexedDB could not be found in this browser.");
        }
    }

    async openDB() {
        const request = indexedDB.open(this.DB_NAME, this.VERSION);

        request.onerror = function (event) {
            console.error("An error occurred with IndexedDB");
            console.error(event);
        };

        request.onupgradeneeded = function () {
            const db = request.result;

            if( db.objectStoreNames.contains(this.STORE_NAME) ) {
                db.deleteObjectStore(this.STORE_NAME)
            }

            let store = db.createObjectStore(this.STORE_NAME, {keyPath: "id", autoIncrement: true});
            store.put(this.DEFAULT)

        }

        request.onsuccess = function () {
            console.log("Database opened successfully");
            request.result.close();
        }
    }

    createPreset(data, name) {
        const request = indexedDB.open(this.DB_NAME, this.VERSION);

        request.onerror = function (event) {
            console.error("An error occurred with IndexedDB");
            console.error(event);
        };

        request.onupgradeneeded = function () {
            console.log("Update Page")
        }

        request.onsuccess = function () {
            const db = request.result;
            const transaction = db.transaction(this.STORE_NAME, "readwrite");
            const store = transaction.objectStore(this.STORE_NAME);

            if (name) {
                store.put({
                    "name": name,
                    "editable": true,
                    "saved": true,
                    "data": data
                });
            }
            else {
                store.put({
                    "name": "Unsaved Patch",
                    "editable": true,
                    "saved": false,
                    "data": data
                });
            }
            transaction.oncomplete = function () {
                db.close();
            };
        }
    }

    async getPreset(id) {
        return new Promise(resolve => {
            const request = indexedDB.open(this.DB_NAME, this.VERSION);

            request.onerror = function (event) {
                console.error("An error occurred with IndexedDB");
                console.error(event);
            };

            request.onupgradeneeded = function () {
                console.log("Update Page")
            }

            request.onsuccess = function () {
                const db = request.result;
                const transaction = db.transaction(this.STORE_NAME, "readonly");
                const store = transaction.objectStore(this.STORE_NAME);

                let res;
                if (id) {
                    res = store.get(parseInt(id));
                }
                else {
                    res = store.getAll();
                }

                res.onsuccess = function () {
                    resolve(res.result)
                }

                transaction.oncomplete = function () {
                    db.close();
                };
            }
        });
    }

    async getUnsaved() {
        let patches = await this.getPreset()
        if (!patches.last.saved) {
            return patches.last.id
        }

        this.createPreset(this.DEFAULT)
        patches = await this.getPreset()
        return patches.last.id
    }

    updatePreset(id, data) {
        if (!id || !data) return;

        const request = indexedDB.open(this.DB_NAME, this.VERSION);

        request.onerror = function (event) {
            console.error("An error occurred with IndexedDB");
            console.error(event);
        };

        request.onupgradeneeded = function () {
            console.log("Update Page")
        }

        request.onsuccess = function () {
            const db = request.result;
            const transaction = db.transaction(this.STORE_NAME, "readwrite");
            const store = transaction.objectStore(this.STORE_NAME);

            let res;
            if (id) {
                res = store.get(parseInt(id));
            } else {
                res = store.getAll();
            }

            res.onsuccess = function () {
                res.result.data = data
                store.put(res.result)
            }

            transaction.oncomplete = function () {
                db.close();
            };
        }
    }
}