
// eslint-disable-next-line no-unused-vars


// eslint-disable-next-line no-unused-vars

export class BiotronDb {
    DB_NAME = "Playtronica_WebMIDI_db"
    STORE_NAME = "BiotronPresets"
    VERSION = 1

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
            db.createObjectStore(this.STORE_NAME, {keyPath: "id", autoIncrement: true});
        }

        request.onsuccess = function () {
            console.log("Database opened successfully");
            request.result.close();
        }
    }

    createPreset(data) {
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

            store.put({
                "name": "TEST_PRESET_DB",
                "editable": true,
                "data": data
            })

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
}