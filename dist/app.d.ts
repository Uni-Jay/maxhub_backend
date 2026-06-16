declare class AppBootstrapper {
    private app;
    private sequelize;
    constructor();
    private initMiddleware;
    private initModels;
    private initAssociations;
    private initRoutes;
    start(): Promise<void>;
}
export { AppBootstrapper };
//# sourceMappingURL=app.d.ts.map