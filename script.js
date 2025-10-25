const SERVICE_ID = "c137e765-1e37-4eb6-9153-bd768a3ef084";
const CHAR_ID = "0b45d758-52b5-46e6-acd5-7765357f9c9b";

let device = null;
let characteristic = null;

async function connect() {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_ID] }]
        });

        // Listen for disconnection
        device.addEventListener('gattserverdisconnected', onDisconnected);

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_ID);
        characteristic = await service.getCharacteristic(CHAR_ID);

        console.log('Connected to', device.name);
        onConnected();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

function onConnected() {
    console.log("Device connected");
    updateVisibility();
}

function onDisconnected() {
    console.log("Device disconnected");
    characteristic = null;
    updateVisibility();
}

async function disconnect() {
    if (device && device.gatt.connected) {
        device.gatt.disconnect();
        console.log('Disconnected manually');
    }
    characteristic = null;
    updateVisibility();
}

function safeDisconnect() {
    try {
        if (device?.gatt?.connected) {
            console.log("Disconnecting BLE device before unload...");
            device.gatt.disconnect();
        }
    } catch (e) {
        console.warn("Disconnect failed:", e);
    }
}

// Handles page lifecycle
window.addEventListener("beforeunload", safeDisconnect);
window.addEventListener("pagehide", safeDisconnect);
window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") safeDisconnect();
});

async function setMode(mode) {
    if (!characteristic) {
        console.error('Not connected');
        return;
    }
    const value = mode;
    if (isNaN(value) || value < 0 || value > 255) {
        alert('Enter a valid byte (0–255)');
        return;
    }

    try {
        const data = new Uint8Array([value]);
        await characteristic.writeValueWithoutResponse(data);
        console.log('Mode set to', value);
    } catch (err) {
        console.error('Write failed:', err);
    }
}

// UI event hookups
window.addEventListener('load', () => {
    document.getElementById('connectBtn').addEventListener('click', connect);
    updateVisibility();
});

// ======================
// UI visibility control
// ======================
function updateVisibility() {
    const connectScreen = document.getElementById("connectScreen");
    const controlScreen = document.getElementById("controlScreen");

    const isConnected = device && device.gatt.connected && characteristic;

    if (isConnected) {
        connectScreen.style.display = "none";
        controlScreen.style.display = "flex";
    } else {
        connectScreen.style.display = "flex";
        controlScreen.style.display = "none";
    }
}
