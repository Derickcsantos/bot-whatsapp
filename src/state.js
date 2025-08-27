// Estado simples em memória (sem banco). Pode evoluir para persistir em arquivo JSON.

let botActive = true; // default ligado


export function getBotActive() {
return botActive;
}


export function setBotActive(value) {
botActive = !!value;
return botActive;
}