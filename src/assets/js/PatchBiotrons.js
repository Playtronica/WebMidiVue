import {toRaw} from "vue";


class Db {
    DB_NAME = "Playtronica_WebMIDI_db"
    STORE_NAME = "Biotron_Patches"
    VERSION = 2
    DEFAULT = {
        "name": "Test Patch",
        "saved": true,
        "editable": false,
        "data": []
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

    createPatch(data, name) {
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

    async getPatch(id) {
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

    async getUnsavedPatch() {
        let patches = await this.getPatch()
        if (!patches.at(-1).saved) {
            return patches.at(-1).id
        }

        this.createPatch(toRaw(this.DEFAULT))
        patches = await this.getPatch()
        return patches.at(-1).id
    }

    deletePatch(id) {
        if (!id) return;
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

            let res = store.delete(id);


            res.onsuccess = function () {
                console.log("Patch deleted")
            }

            transaction.oncomplete = function () {
                db.close();
            };
        }
    }


    updatePatch(id, data) {
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

    savePatch(id, name) {
        if (!id || !name) return;
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
                res.result.name = name
                res.result.saved = true
                store.put(res.result)
            }

            transaction.oncomplete = function () {
                db.close();
            };
        }
    }
}

export class BiotronDb extends Db {
    STORE_NAME = "Biotron_Patches"
    VERSION = 3
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
                "name": "range_light_note",
                "value": 12
            },
            {
                "name": "plant_no_velocity",
                "value": 0
            },
            {
                "name": "light_pitch_mode",
                "value": 0,
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
}