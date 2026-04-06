# Quantity Measurement App

A modern web application for quantity measurement, conversion, comparison, and arithmetic operations. Built with vanilla JavaScript, HTML, and CSS.

## Features

- **Unit Conversion**: Convert between different units of measurement (length, weight, temperature, volume)
- **Unit Comparison**: Compare quantities with different units
- **Arithmetic Operations**: Perform addition, subtraction, multiplication, and division on quantities
- **History Tracking**: View and manage conversion history
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Offline Support**: History is stored locally in browser storage


## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Quantity-Measurement-App
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Starting the Development Server

The app uses JSON Server as a mock API for units and conversion data:

```bash
npm start
```

This will start the JSON Server on `http://localhost:3000` and serve the static files.

### Alternative: Serve Static Files Only

If you only want to serve the static files without the API server:

```bash
npm run serve
```

This will serve the files on `http://localhost:8080`.

### Opening the Application

After starting the server, open your browser and navigate to:
- `http://localhost:3000` (if using npm start)
- `http://localhost:8080` (if using npm run serve)

## Project Structure

```
Quantity-Measurement-App/
├── index.html              # Main HTML file
├── package.json            # Project dependencies and scripts
├── db.json                 # JSON Server database (units, conversions, history)
├── css/
│   ├── styles.css          # Main stylesheet
│   └── components.css      # Component-specific styles
├── js/
│   ├── app.js              # Main application logic
│   ├── api.js              # API communication functions
│   ├── conversion.js       # Conversion logic and calculations
│   ├── state.js            # Application state management
│   └── ui.js               # User interface interactions
└── images/                 # Application images and icons
```

## API Endpoints

The application uses JSON Server to provide RESTful API endpoints:

- `GET /units?type={type}` - Get all units for a specific measurement type
- `GET /conversions?from={from}&to={to}&type={type}` - Get conversion factors between units

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: JSON Server (for development/mock API)
- **Package Manager**: npm
- **Build Tools**: None (vanilla JS project)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

### Adding New Units

To add new measurement units:

1. Add the unit to the `units` array in `db.json`
2. Include the unit type, name, symbol, and base factor
3. For conversions, add entries to the `conversions` array

## Future Enhancements

- [ ] Unit system preferences (Metric/Imperial)
- [ ] Custom unit definitions
- [ ] Advanced arithmetic with multiple units
- [ ] Export/import history
- [ ] Dark mode toggle
- [ ] Mobile app version
- [ ] Real-time collaborative calculations

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub repository.
