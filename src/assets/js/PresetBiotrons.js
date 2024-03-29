

// eslint-disable-next-line no-unused-vars
export class BiotronDb {
    DB_NAME = "Playtronica_WebMIDI_db"
    STORE_NAME = "BiotronPresets"
    VERSION = 3


    async openDB() {
        if (!window.indexedDB) {
            console.log()
            return
        }

        // eslint-disable-next-line no-unused-vars
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.open(this.DB_NAME, this.VERSION);

            request.onsuccess = e => {
                let DB = e.target.result;
                resolve(DB);
            };

            request.onerror = e => {
                console.log('Error opening db', e);
                reject('Error');
            };


            request.onupgradeneeded = e => {
                const db = e.target.result;
                if( db.objectStoreNames.contains(this.STORE_NAME) ) {
                    db.deleteObjectStore(this.STORE_NAME)
                }

                const store = db.createObjectStore(this.STORE_NAME, { keyPath: "id", autoIncrement: true });

                store.createIndex("preset_name", ["name"], { unique: false,})
                store.createIndex("deletable", ["deletable"], { unique: false })
                store.createIndex("data", ["data"], { unique: false })
            };
        });
    }

    async createPreset(data) {
        let db = await this.openDB()

        return new Promise(resolve => {
            let transaction = db.transaction(this.STORE_NAME, "readwrite");
            transaction.oncomplete = () => {
              resolve();
            };
            const store = transaction.objectStore(this.STORE_NAME)

            store.put({
                name: "TestPresetCreation",
                deletable: true,
                data: data
            })

        })




    }
}