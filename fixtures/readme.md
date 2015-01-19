## Fresh Data

Use [JSON Generator](http://www.json-generator.com/) with the following templates for fixtures.

### Template for Donation

    [
        "{{ repeat(50, 100) }}", {
            data: {
                email: "{{ email() }}",
                amount: "{{ integer(100, 5000) }}",
                campaign: function( tags ) {
                    var list = ['sanga', 'lila', 'lighthouse', 'general'];
                    return list[tags.integer( 0, list.length - 1 )];
                },
                description: "Just Testing",
                donorID: "{{ integer(1, 10) }}",
            },
            "model": "Donation"
        },
    ]


### Template for Donor

    [
        "{{ repeat(10, 10) }}", {
            data: {
                name: "{{ firstName() }} {{ surname() }}",
                email: "{{ email() }}",
                addressCity: "{{ city() }}",
                addressState: "{{ state() }}",
                addressStreet: "{{ street() }}",
                addressPostal: "{{ integer(10000, 99999) }}",
                addressCountry: "US",

                subscriber: function( tags ) {
                    var number = (Math.random() * 100).toFixed(0);

                    return !!(number % 2);
                }
            },
            "model": "Donor"
        }
    ]
