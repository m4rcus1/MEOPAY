/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,hbs}"],
    theme: {
        extend: {
            colors: {
                myColor: 'rgb(0,73,173)',
                color1: 'rgb(184, 191, 255)',
            },
            spacing: {
                '150': '150px',
                '120': '120px',
                '300': '300px',
            }
        },
    },
    plugins: [
        require('tw-elements/dist/plugin')
    ],
}