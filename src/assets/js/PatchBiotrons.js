import {toRaw} from "vue";


export class BiotronDb {
    DB_NAME = "Playtronica_WebMIDI_db"
    STORE_NAME = "Biotron_Patches"
    VERSION = 1

    DEFAULT = {
        "name": "Biotron Default Patch",
        "saved": true,
        "editable": false,
        "data": [
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
        },
        {
            "name": "plant_no_velocity",
            "value": 0
        },
        {
            "name": "light_no_velocity",
            "value": 0
        },
        {
            "name": "randomPlantVelocity",
            "value": 0
        },
        {
            "name": "randomLightVelocity",
            "value": 0
        }
    ]}

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
        let vm = this

        request.onerror = function (event) {
            console.error("An error occurred with IndexedDB");
            console.error(event);
        };

        request.onupgradeneeded = function () {
            const db = request.result;

            if( db.objectStoreNames.contains(vm.STORE_NAME) ) {
                db.deleteObjectStore(vm.STORE_NAME)
            }

            let store = db.createObjectStore(vm.STORE_NAME, {keyPath: "id", autoIncrement: true});
            store.put(toRaw(vm.DEFAULT))
        }

        request.onsuccess = function () {
            console.log("Database opened successfully");
            request.result.close();
        }
    }

    createPreset(data, name) {
        const request = indexedDB.open(this.DB_NAME, this.VERSION);
        let vm = this;
        request.onerror = function (event) {
            console.error("An error occurred with IndexedDB");
            console.error(event);
        };

        request.onupgradeneeded = function () {
            console.log("Update Page")
        }

        request.onsuccess = function () {
            const db = request.result;
            const transaction = db.transaction(vm.STORE_NAME, "readwrite");
            const store = transaction.objectStore(vm.STORE_NAME);

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
        let vm = this;
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
                const transaction = db.transaction(vm.STORE_NAME, "readonly");
                const store = transaction.objectStore(vm.STORE_NAME);

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
        let vm = this;
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
            const transaction = db.transaction(vm.STORE_NAME, "readwrite");
            const store = transaction.objectStore(vm.STORE_NAME);

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