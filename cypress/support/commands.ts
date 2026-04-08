declare global {
    namespace Cypress {
        interface Chainable {
            login(): Chainable<void>;
        }
    }
}

export { };
