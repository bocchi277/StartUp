-- Hospitality taxonomy. Shipped as a migration (not seed.sql) so the hosted
-- project gets it through `supabase db push`. Hindi names need a native review.

insert into public.job_roles (slug, name_en, name_hi, category, sort_order) values
  ('indian_chef',        'Indian Chef',                 'भारतीय शेफ',                    'kitchen',    10),
  ('tandoor_chef',       'Tandoor Chef',                'तंदूर शेफ',                     'kitchen',    20),
  ('chinese_chef',       'Chinese Chef',                'चाइनीज़ शेफ',                    'kitchen',    30),
  ('continental_chef',   'Continental Chef',            'कॉन्टिनेंटल शेफ',                'kitchen',    40),
  ('south_indian_chef',  'South Indian Chef',           'साउथ इंडियन शेफ',                'kitchen',    50),
  ('baker_pastry_chef',  'Baker / Pastry Chef',         'बेकर / पेस्ट्री शेफ',             'kitchen',    60),
  ('head_chef',          'Head Chef / Kitchen Supervisor', 'हेड शेफ / किचन सुपरवाइज़र',     'kitchen',    70),
  ('commis_cook',        'Cook / Commis',               'कुक / कमी शेफ',                  'kitchen',    80),
  ('kitchen_helper',     'Kitchen Helper',              'किचन हेल्पर',                    'kitchen',    90),
  ('dishwasher_cleaner', 'Dishwasher / Cleaner',        'बर्तन धोने वाला / सफ़ाई कर्मचारी', 'kitchen',   100),
  ('barista',            'Barista',                     'बरिस्ता',                        'service',   110),
  ('waiter_steward',     'Waiter / Steward',            'वेटर / स्टीवर्ड',                 'service',   120),
  ('captain_supervisor', 'Captain / Floor Supervisor',  'कैप्टन / फ़्लोर सुपरवाइज़र',       'service',   130),
  ('cashier',            'Cashier',                     'कैशियर',                         'service',   140),
  ('bartender',          'Bartender',                   'बारटेंडर',                       'service',   150),
  ('delivery_staff',     'Delivery Staff',              'डिलीवरी स्टाफ़',                  'other',     160),
  ('restaurant_manager', 'Restaurant Manager',          'रेस्टोरेंट मैनेजर',               'management', 170);

insert into public.cuisines (slug, name_en, name_hi, sort_order) values
  ('north_indian',   'North Indian',          'नॉर्थ इंडियन',          10),
  ('mughlai',        'Mughlai',               'मुग़लई',               20),
  ('tandoori',       'Tandoori',              'तंदूरी',               30),
  ('south_indian',   'South Indian',          'साउथ इंडियन',          40),
  ('chinese',        'Chinese / Indo-Chinese','चाइनीज़ / इंडो-चाइनीज़', 50),
  ('continental',    'Continental',           'कॉन्टिनेंटल',           60),
  ('italian',        'Italian / Pizza',       'इटैलियन / पिज़्ज़ा',      70),
  ('bakery_desserts','Bakery & Desserts',     'बेकरी और डेज़र्ट',        80),
  ('street_food',    'Street Food / Chaat',   'स्ट्रीट फ़ूड / चाट',      90),
  ('fast_food',      'Fast Food',             'फ़ास्ट फ़ूड',            100),
  ('cafe_beverages', 'Café & Beverages',      'कैफ़े और पेय',          110),
  ('regional_thali', 'Regional / Thali',      'रीजनल / थाली',          120);

insert into public.skills (slug, name_en, name_hi, category, sort_order) values
  ('tandoor_operation', 'Tandoor operation',         'तंदूर चलाना',              'kitchen',    10),
  ('wok_cooking',       'Wok cooking',               'वोक कुकिंग',               'kitchen',    20),
  ('curries_gravies',   'Curries & gravies',         'करी और ग्रेवी',             'kitchen',    30),
  ('biryani',           'Biryani',                   'बिरयानी',                  'kitchen',    40),
  ('dosa_idli',         'Dosa / Idli',               'डोसा / इडली',              'kitchen',    50),
  ('pastry_baking',     'Pastry & baking',           'पेस्ट्री और बेकिंग',         'kitchen',    60),
  ('pizza',             'Pizza making',              'पिज़्ज़ा बनाना',              'kitchen',    70),
  ('grill_bbq',         'Grill / BBQ',               'ग्रिल / बारबेक्यू',          'kitchen',    80),
  ('food_prep',         'Cutting & prep',            'कटिंग और तैयारी',           'kitchen',    90),
  ('food_safety',       'Food safety & hygiene',     'फ़ूड सेफ़्टी और साफ़-सफ़ाई',   'kitchen',   100),
  ('inventory',         'Inventory / stock',         'इन्वेंटरी / स्टॉक',          'management', 110),
  ('kitchen_supervision','Kitchen supervision',      'किचन सुपरविज़न',            'management', 120),
  ('espresso',          'Espresso / coffee machine', 'एस्प्रेसो / कॉफ़ी मशीन',      'service',   130),
  ('latte_art',         'Latte art',                 'लाटे आर्ट',                 'service',   140),
  ('table_service',     'Table service',             'टेबल सर्विस',               'service',   150),
  ('order_taking',      'Order taking',              'ऑर्डर लेना',                'service',   160),
  ('pos_billing',       'POS / billing',             'POS / बिलिंग',              'service',   170),
  ('cash_handling',     'Cash handling',             'कैश संभालना',               'service',   180),
  ('guest_handling',    'Guest handling',            'ग्राहकों से बातचीत',          'service',   190),
  ('bartending',        'Bartending',                'बारटेंडिंग',                'service',   200),
  ('staff_scheduling',  'Staff scheduling',          'स्टाफ़ शेड्यूलिंग',           'management', 210),
  ('cost_control',      'Food cost control',         'फ़ूड कॉस्ट कंट्रोल',          'management', 220);
