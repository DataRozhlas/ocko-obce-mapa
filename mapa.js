/* eslint-disable no-undef */
let host = 'https://data.irozhlas.cz/ocko-obce-mapa';
if (window.location.hostname === 'localhost') {
  host = 'http://localhost/ocko-obce-mapa';
}

const map = L.map('covid_ocko_mapa', { scrollWheelZoom: false });
const bg = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, data <a target="_blank" href="https://www.uzis.cz/">ÚZIS k 24. 7. 2021</a>',
  subdomains: 'abcd',
  maxZoom: 15,
});

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');

  div.innerHTML = `<i style="background:#b2182b"></i>< 46 %<br>`
    + `<i style="background:#ef8a62"></i>46-54 %<br>`
    + `<i style="background:#fddbc7"></i>54-60 %<br>`
    + `<i style="background:#67a9cf"></i>> 60 %<br>`;

  // loop through our density intervals and generate a label with a colored square for each interval

  return div;
};

legend.addTo(map);

map.on('click', () => map.scrollWheelZoom.enable());

bg.addTo(map);

L.TopoJSON = L.GeoJSON.extend({
  addData(data) {
    let geojson; let key;
    if (data.type === 'Topology') {
      // eslint-disable-next-line no-restricted-syntax
      for (key in data.objects) {
        if (data.objects.hasOwnProperty(key)) {
          geojson = topojson.feature(data, data.objects[key]);
          L.GeoJSON.prototype.addData.call(this, geojson);
        }
      }
      return this;
    }
    L.GeoJSON.prototype.addData.call(this, data);
    return this;
  },
});
L.topoJson = function (data, options) {
  return new L.TopoJSON(data, options);
};

let data = null;

function getPct(p, c) {
  return Math.round((p / c) * 1000) / 10;
}

const geojson = L.topoJson(null, {
  style(feature) {
    const oid = feature.properties.kod;
    return {
      color: 'lightgray',
      opacity: 1,
      weight: 0.5,
      fillOpacity: 0.8,
      fillColor: getCol(oid),
    };
  },
  onEachFeature(feature, layer) {
    layer.on('click', (e) => {
      const d = data.find((o) => o[0] === e.target.feature.properties.kod);
      const sumOcko = d[3] + d[5] + d[7] + d[9] + d[11] + d[13];
      const obyv = d[2] + d[4] + d[6] + d[8] + d[10] + d[12];
      // if ((val === Infinity) || (isNaN(val))) { return; }
      layer.bindPopup(
        `<b>${d[1]}</b><br>Naočkováno ${getPct(sumOcko, obyv)} % způsobilých obyvatel (z celkem ${obyv.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;')}).<br>`
        + `<br>${getPct(d[13], d[12])} % dětí do 16 let`
        + `<br>${getPct(d[3], d[2])} % osob 16+`
        + `<br>${getPct(d[11], d[10])} % osob 16-29`
        + `<br>${getPct(d[9], d[8])} % osob 30-49`
        + `<br>${getPct(d[7], d[6])} % osob 50-59`
        + `<br>${getPct(d[5], d[4])} % osob 60+`,
      ).openPopup();
    });
  },
});
geojson.addTo(map);
fetch(`${host}/obce.json`)
  .then((response) => response.json())
  .then((tjs) => {
    fetch(`${host}/data.json`)
      .then((response) => response.json())
      .then((dat) => {
        data = dat;
        dat = null;
        const dkeys = data.map((r) => r[0]);
        tjs.objects.ob.geometries = tjs.objects.ob.geometries.filter((ob) => {
          if (dkeys.includes(ob.properties.kod)) {
            return true;
          }
          return false;
        });
        geojson.addData(tjs);

        map.fitBounds(geojson.getBounds());
        if (screen.width < 600) {
          //map.zoomIn(1);
        }
      });
  });

function getCol(oid) {
  const d = data.find((e) => e[0] === oid);
  const val = (d[3] + d[5] + d[7] + d[9] + d[11] + d[13])
    / (d[2] + d[4] + d[6] + d[8] + d[10] + d[12]);

  if ((val === Infinity) || (isNaN(val)) || (val < 0)) { return 'lightgray'; }

  if (val <= 0.46) { return '#b2182b'; } // Jenks
  if (val <= 0.54) { return '#ef8a62'; }
  if (val <= 0.6) { return '#fddbc7'; }
  if (val > 0.6) { return '#67a9cf'; }
  return '#2166ac';

  if (val <= 0.39) { return '#b2182b'; } // Equal Intervals
  if (val <= 0.66) { return '#ef8a62'; }
  if (val <= 0.93) { return '#fddbc7'; }
  if (val > 0.93) { return '#67a9cf'; }
  return '#2166ac';
}

// geocoder
const form = document.getElementById('geocoder');
form.onsubmit = function submitForm(event) {
  event.preventDefault();
  const text = document.getElementById('inp-geocode').value;
  if (text === '') {
    return;
  }
  fetch(`https://api.mapy.cz/geocode?query=${text}, Česká republika`) // Mapy.cz geocoder
    .then((res) => res.text())
    .then((str) => (new window.DOMParser()).parseFromString(str, 'text/xml'))
    .then((results) => {
      const res = results.firstChild.children[0];

      if (res.children.length === 0) {
        return;
      }
      const x = parseFloat(res.children[0].attributes.x.value);
      const y = parseFloat(res.children[0].attributes.y.value);

      map.flyTo([y, x], 11);
    })
    .catch((err) => { throw err; });
};
