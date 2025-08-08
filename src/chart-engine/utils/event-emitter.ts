type EventListner = (...args: any[]) => void

export class EventEmitter{

    private events: Map<string,Set<EventListner>>

    constructor() {
        this.events = new Map()
    }

    on(event:string,listner:EventListner){
        if(!this.events.has(event)){
            this.events.set(event, new Set())
        }

        this.events.get(event)?.add(listner)
    }

    off(event:string,listnertoRemove:EventEmitter){
        
        if(!this.events.has(event)) return;

        this.events.get(event)?.delete(listnertoRemove)
    }

    emit(event:string,...args: any[]){
        if(!this.events.has(event)) return;

        this.events.get(event)?.forEach(listeners => listeners(...args))
    }
}