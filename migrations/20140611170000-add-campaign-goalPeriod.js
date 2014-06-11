module.exports = {
    up: function( migration, type, done ) {

        migration.addColumn(
            "Campaigns",
            "goalPeriod",
            { type: type.STRING }
        )

        done();
    },

    down: function( migration, type, done ) {

        migration.removeColumn('Campaigns', 'goalPeriod')

        done();
    }
}
