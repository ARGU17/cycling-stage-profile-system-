(function () {
  'use strict';
  const catalog = window.CYCLING_CATALOG;
  if (!catalog?.countries) return;
  const A = (name, lat, lon, ele, roles) => ({ name, lat, lon, ele, roles: roles || ['town'] });

  const countries = {
    australia: {
      label: 'Australia', flag: '🇦🇺', regions: [
        {
          id: 'au_adelaide', name: 'Adelaida y Adelaide Hills', terrain: ['flat', 'rolling', 'punchy', 'medium_mountain'], anchors: [
            A('Adelaide', -34.9285, 138.6007, 50), A('Glenelg', -34.9800, 138.5120, 8),
            A('McLaren Vale', -35.2180, 138.5420, 95), A('Willunga', -35.2710, 138.5540, 130),
            A('Willunga Hill', -35.2795, 138.5811, 372, ['climb', 'summit']), A('Mount Barker', -35.0667, 138.8580, 360),
            A('Lobethal', -34.9040, 138.8740, 420, ['climb']), A('Tanunda', -34.5260, 138.9590, 255)
          ]
        },
        {
          id: 'au_victoria', name: 'Victoria y Great Ocean Road', terrain: ['flat', 'rolling', 'punchy'], anchors: [
            A('Geelong', -38.1499, 144.3617, 22), A('Torquay', -38.3320, 144.3260, 15),
            A('Lorne', -38.5400, 143.9760, 12), A('Apollo Bay', -38.7550, 143.6700, 9),
            A('Anglesea', -38.4070, 144.1850, 25), A('Bells Beach', -38.3690, 144.2830, 48, ['climb']),
            A('Moriac', -38.2400, 144.1730, 95), A('Ceres', -38.1710, 144.2620, 115, ['climb', 'summit'])
          ]
        }
      ]
    },
    uae: {
      label: 'Emiratos Árabes Unidos', flag: '🇦🇪', regions: [
        {
          id: 'ae_desert', name: 'Abu Dabi y Dubái', terrain: ['flat', 'rolling'], anchors: [
            A('Abu Dhabi', 24.4539, 54.3773, 5), A('Yas Island', 24.4950, 54.6050, 4),
            A('Al Ain', 24.1302, 55.8023, 290), A('Dubai', 25.2048, 55.2708, 8),
            A('Hatta', 24.8000, 56.1167, 320, ['climb']), A('Al Qudra', 24.8370, 55.3460, 55),
            A('Jebel Ali', 24.9857, 55.0273, 12), A('Sharjah', 25.3463, 55.4209, 6)
          ]
        },
        {
          id: 'ae_mountains', name: 'Hajar y grandes ascensiones', terrain: ['rolling', 'medium_mountain', 'high_mountain'], anchors: [
            A('Ras Al Khaimah', 25.8007, 55.9762, 15), A('Jebel Jais', 25.9530, 56.1440, 1480, ['climb', 'summit']),
            A('Fujairah', 25.1288, 56.3265, 20), A('Khor Fakkan', 25.3313, 56.3573, 18),
            A('Hatta', 24.8000, 56.1167, 320), A('Jebel Hafeet', 24.0560, 55.7780, 1249, ['climb', 'summit']),
            A('Al Ain', 24.1302, 55.8023, 290), A('Masafi', 25.3130, 56.1620, 560, ['climb'])
          ]
        }
      ]
    },
    belgium: {
      label: 'Bélgica', flag: '🇧🇪', regions: [
        {
          id: 'be_flanders', name: 'Flandes y pavé', terrain: ['flat', 'rolling', 'punchy'], anchors: [
            A('Gent', 51.0543, 3.7174, 10), A('Brugge', 51.2093, 3.2247, 8),
            A('Kortrijk', 50.8278, 3.2649, 20), A('Oudenaarde', 50.8430, 3.6040, 20),
            A('Koppenberg', 50.8117, 3.5765, 77, ['climb']), A('Oude Kwaremont', 50.7766, 3.5190, 111, ['climb']),
            A('Geraardsbergen', 50.7700, 3.8820, 28), A('Muur van Geraardsbergen', 50.7720, 3.8880, 110, ['climb', 'summit'])
          ]
        },
        {
          id: 'be_ardennes', name: 'Ardenas', terrain: ['rolling', 'punchy', 'medium_mountain'], anchors: [
            A('Liège', 50.6326, 5.5797, 65), A('Spa', 50.4920, 5.8640, 250),
            A('Stavelot', 50.3950, 5.9310, 300), A('La Redoute', 50.4905, 5.7435, 300, ['climb']),
            A('Huy', 50.5180, 5.2320, 85), A('Mur de Huy', 50.5105, 5.2400, 204, ['climb', 'summit']),
            A('Bastogne', 49.9990, 5.7150, 515), A('Durbuy', 50.3520, 5.4560, 175)
          ]
        }
      ]
    },
    netherlands: {
      label: 'Países Bajos', flag: '🇳🇱', regions: [
        {
          id: 'nl_randstad', name: 'Randstad y costa', terrain: ['flat', 'rolling'], anchors: [
            A('Amsterdam', 52.3676, 4.9041, 2), A('Rotterdam', 51.9244, 4.4777, 0),
            A('The Hague', 52.0705, 4.3007, 1), A('Utrecht', 52.0907, 5.1214, 5),
            A('Haarlem', 52.3874, 4.6462, 3), A('Leiden', 52.1601, 4.4970, 2),
            A('Gouda', 52.0116, 4.7105, 0), A('Alkmaar', 52.6324, 4.7534, 1)
          ]
        },
        {
          id: 'nl_limburg', name: 'Limburgo', terrain: ['rolling', 'punchy', 'medium_mountain'], anchors: [
            A('Maastricht', 50.8514, 5.6910, 50), A('Valkenburg', 50.8652, 5.8321, 70),
            A('Cauberg', 50.8628, 5.8232, 133, ['climb']), A('Gulpen', 50.8158, 5.8880, 95),
            A('Epen', 50.7750, 5.9120, 150), A('Vijlenerbos', 50.7700, 5.9600, 265, ['climb', 'summit']),
            A('Heerlen', 50.8882, 5.9795, 113), A('Sittard', 50.9980, 5.8690, 48)
          ]
        }
      ]
    },
    germany: {
      label: 'Alemania', flag: '🇩🇪', regions: [
        {
          id: 'de_taunus', name: 'Fráncfort y Taunus', terrain: ['flat', 'rolling', 'punchy', 'medium_mountain'], anchors: [
            A('Frankfurt', 50.1109, 8.6821, 112), A('Eschborn', 50.1433, 8.5711, 135),
            A('Königstein', 50.1790, 8.4660, 362), A('Feldberg', 50.2320, 8.4580, 878, ['climb', 'summit']),
            A('Wiesbaden', 50.0782, 8.2398, 117), A('Mainz', 49.9929, 8.2473, 90),
            A('Bad Homburg', 50.2268, 8.6182, 195), A('Mammolshain', 50.1860, 8.4930, 330, ['climb'])
          ]
        },
        {
          id: 'de_hamburg', name: 'Hamburgo y norte', terrain: ['flat', 'rolling'], anchors: [
            A('Hamburg', 53.5511, 9.9937, 8), A('Blankenese', 53.5590, 9.8040, 35),
            A('Waseberg', 53.5608, 9.7900, 76, ['climb']), A('Lüneburg', 53.2464, 10.4115, 17),
            A('Stade', 53.5990, 9.4760, 5), A('Buxtehude', 53.4760, 9.7010, 5),
            A('Buchholz', 53.3260, 9.8790, 75), A('Wedel', 53.5830, 9.6980, 8)
          ]
        }
      ]
    },
    switzerland: {
      label: 'Suiza', flag: '🇨🇭', regions: [
        {
          id: 'ch_jura', name: 'Romandía y Jura', terrain: ['rolling', 'punchy', 'medium_mountain'], anchors: [
            A('Genève', 46.2044, 6.1432, 375), A('Lausanne', 46.5197, 6.6323, 495),
            A('Montreux', 46.4312, 6.9107, 390), A('Neuchâtel', 46.9896, 6.9293, 430),
            A('Yverdon', 46.7785, 6.6412, 435), A('Col du Marchairuz', 46.5530, 6.2500, 1447, ['climb', 'summit']),
            A('Sion', 46.2331, 7.3606, 510), A('Fribourg', 46.8065, 7.1619, 610)
          ]
        },
        {
          id: 'ch_alps', name: 'Alpes suizos', terrain: ['medium_mountain', 'high_mountain'], anchors: [
            A('Bern', 46.9480, 7.4474, 540), A('Interlaken', 46.6863, 7.8632, 568),
            A('Grindelwald', 46.6242, 8.0414, 1034, ['summit']), A('Andermatt', 46.6356, 8.5939, 1447),
            A('Gotthard Pass', 46.5594, 8.5610, 2106, ['climb', 'summit']), A('Furka Pass', 46.5726, 8.4152, 2429, ['climb']),
            A('Davos', 46.8027, 9.8360, 1560), A('Flüela Pass', 46.7500, 9.9470, 2383, ['climb', 'summit'])
          ]
        }
      ]
    },
    denmark: {
      label: 'Dinamarca', flag: '🇩🇰', regions: [
        {
          id: 'dk_zealand', name: 'Copenhague y Selandia', terrain: ['flat', 'rolling'], anchors: [
            A('Copenhagen', 55.6761, 12.5683, 8), A('Roskilde', 55.6419, 12.0878, 35),
            A('Hillerød', 55.9279, 12.3008, 40), A('Helsingør', 56.0308, 12.5921, 10),
            A('Køge', 55.4580, 12.1820, 8), A('Holbæk', 55.7180, 11.7160, 18),
            A('Frederikssund', 55.8390, 12.0680, 12), A('Valby Bakke', 55.6630, 12.5200, 34, ['climb', 'summit'])
          ]
        },
        {
          id: 'dk_jutland', name: 'Jutlandia', terrain: ['flat', 'rolling', 'punchy'], anchors: [
            A('Aarhus', 56.1629, 10.2039, 15), A('Vejle', 55.7113, 9.5364, 5),
            A('Kolding', 55.4959, 9.4731, 10), A('Silkeborg', 56.1697, 9.5451, 30),
            A('Aalborg', 57.0488, 9.9217, 5), A('Horsens', 55.8581, 9.8476, 5),
            A('Munkebjerg', 55.6940, 9.5830, 85, ['climb']), A('Ejer Bavnehøj', 55.9770, 9.8310, 171, ['climb', 'summit'])
          ]
        }
      ]
    },
    poland: {
      label: 'Polonia', flag: '🇵🇱', regions: [
        {
          id: 'pl_south', name: 'Cracovia y Tatras', terrain: ['rolling', 'punchy', 'medium_mountain', 'high_mountain'], anchors: [
            A('Kraków', 50.0647, 19.9450, 188), A('Katowice', 50.2649, 19.0238, 266),
            A('Bielsko-Biała', 49.8224, 19.0469, 300), A('Zakopane', 49.2992, 19.9496, 838),
            A('Bukowina Tatrzańska', 49.3430, 20.1080, 920, ['climb', 'summit']), A('Karpacz', 50.7767, 15.7559, 480),
            A('Orlinek', 50.7750, 15.7390, 800, ['climb', 'summit']), A('Nowy Sącz', 49.6218, 20.6970, 281)
          ]
        },
        {
          id: 'pl_central', name: 'Mazovia y centro', terrain: ['flat', 'rolling'], anchors: [
            A('Warszawa', 52.2297, 21.0122, 100), A('Łódź', 51.7592, 19.4560, 205),
            A('Płock', 52.5463, 19.7065, 105), A('Radom', 51.4027, 21.1471, 160),
            A('Lublin', 51.2465, 22.5684, 170), A('Kielce', 50.8661, 20.6286, 260),
            A('Częstochowa', 50.8118, 19.1203, 250), A('Sandomierz', 50.6827, 21.7489, 200)
          ]
        }
      ]
    },
    canada: {
      label: 'Canadá', flag: '🇨🇦', regions: [
        {
          id: 'ca_quebec', name: 'Québec y Charlevoix', terrain: ['rolling', 'punchy', 'medium_mountain'], anchors: [
            A('Québec', 46.8139, -71.2080, 65), A('Lévis', 46.8033, -71.1779, 40),
            A('Beaupré', 47.0450, -70.9000, 10), A('Mont-Sainte-Anne', 47.0750, -70.9050, 625, ['climb', 'summit']),
            A('Baie-Saint-Paul', 47.4411, -70.4986, 10), A('Stoneham', 47.1700, -71.3700, 220),
            A('Côte de la Montagne', 46.8130, -71.2050, 70, ['climb']), A('Sainte-Foy', 46.7790, -71.3060, 90)
          ]
        },
        {
          id: 'ca_montreal', name: 'Montréal y Laurentides', terrain: ['flat', 'rolling', 'punchy', 'medium_mountain'], anchors: [
            A('Montréal', 45.5017, -73.5673, 36), A('Mont-Royal', 45.5071, -73.5874, 233, ['climb', 'summit']),
            A('Laval', 45.6066, -73.7124, 20), A('Longueuil', 45.5312, -73.5181, 15),
            A('Saint-Sauveur', 45.8950, -74.1600, 220), A('Mont-Tremblant', 46.1185, -74.5962, 250),
            A('Lac-Supérieur', 46.2000, -74.4700, 280, ['climb']), A('Bromont', 45.3160, -72.6500, 145)
          ]
        }
      ]
    },
    china: {
      label: 'China', flag: '🇨🇳', regions: [
        {
          id: 'cn_guangxi', name: 'Guangxi', terrain: ['flat', 'rolling', 'punchy', 'medium_mountain', 'high_mountain'], anchors: [
            A('Nanning', 22.8170, 108.3665, 80), A('Liuzhou', 24.3264, 109.4281, 90),
            A('Guilin', 25.2742, 110.2991, 150), A('Yangshuo', 24.7785, 110.4966, 110),
            A('Longji', 25.7830, 110.1450, 820, ['climb', 'summit']), A('Hezhou', 24.4141, 111.5520, 110),
            A('Bama', 24.1410, 107.2530, 260), A('Mashan', 23.7080, 108.1760, 185, ['climb'])
          ]
        }
      ]
    },
    benelux: {
      label: 'Bélgica y Países Bajos', flag: '🇧🇪🇳🇱', regions: []
    },
    world: {
      label: 'Circuito mundial', flag: '🌍', regions: []
    }
  };

  countries.benelux.regions = [
    ...countries.belgium.regions.map(region => ({ ...region, id: `bx_${region.id}`, anchors: region.anchors.map(a => ({ ...a })) })),
    ...countries.netherlands.regions.map(region => ({ ...region, id: `bx_${region.id}`, anchors: region.anchors.map(a => ({ ...a })) }))
  ];
  countries.world.regions = countries.canada.regions.map(region => ({ ...region, id: `world_${region.id}`, anchors: region.anchors.map(a => ({ ...a })) }));

  Object.entries(countries).forEach(([key, value]) => {
    if (!catalog.countries[key]) catalog.countries[key] = value;
  });
})();
