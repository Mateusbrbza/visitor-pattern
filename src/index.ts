type Listener<EventType> = (ev: EventType) => void;
function createObserver<EventType>(): {
    subscribe: (listener: Listener<EventType>) => () => void;
    publish: (event: EventType) => void;
} {
    let listeners: Listener<EventType>[] = [];

    return {
        subscribe: (listener: Listener<EventType>): () => void => {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(lis => lis !== listener)
            }
        },
        publish: (event: EventType) => {
            listeners.forEach(lis => lis(event));
        },
    }
}

interface BeforeSetEvent<T> {
    value: T;
    newValue: T;
}

interface AfterSetEvent<T> {
    value: T;
}

interface Pokemon {
    id: string;
    attack: number;
    defense: number;
}

interface BaseRecord {
    id: string;
}

interface Database<T extends BaseRecord> {
    set(newValue: T): void;
    get(id: string): T | undefined;

    onBeforeAdd(listener: Listener<BeforeSetEvent<T>>): () => void;
    onAfterAdd(listener: Listener<AfterSetEvent<T>>): () => void;

    visit(visitor: (item: T) => void): void;
}

function createDabatase<T extends BaseRecord>() {
    class InMemoryDB implements Database<T> {
        private db: Record<string, T> = {};

        static instance:InMemoryDB = new InMemoryDB();

        private beforeAddListeners = createObserver<BeforeSetEvent<T>>();
        private afterAddListeners = createObserver<AfterSetEvent<T>>();

        private constructor() {}

        public set(newValue: T): void {
            this.beforeAddListeners.publish({
                newValue,
                value: this.db[newValue.id],
            });

            this.db[newValue.id] = newValue;

            this.afterAddListeners.publish({
                value: newValue,
            })
        }
        public get(id: string): T | undefined {
            return this.db[id]
        }

        onBeforeAdd(listener: Listener<BeforeSetEvent<T>>): () => void {
            return this.beforeAddListeners.subscribe(listener);
        };
        onAfterAdd(listener: Listener<AfterSetEvent<T>>): () => void {
            return this.afterAddListeners.subscribe(listener);
        };

        // Visitor
        visit(visitor: (item: T) => void): void {
            Object.values(this.db).forEach(visitor);
        }
    }
    return InMemoryDB
}

const PokemonDB = createDabatase<Pokemon>();

const unsubscribe = PokemonDB.instance.onAfterAdd(({
    value
}) => {
    console.log(value);
});

PokemonDB.instance.set({
    id: 'Bulbasaur',
    attack: 50,
    defense: 12,
});

unsubscribe();

PokemonDB.instance.set({
    id: 'Shitsaur',
    attack: 89,
    defense: 99,
});

// console.log(PokemonDB.instance.get('Bulbasaur'));

PokemonDB.instance.visit((item) => {
    console.log(item.id);
});