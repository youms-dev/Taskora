import EventEmitter from "eventemitter3";

export const event = new EventEmitter();

export const MODAL_OPEN =  "modalOpen";
export const MODAL_CLOSED =  "modalClosed";