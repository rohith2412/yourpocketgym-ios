export interface Recipe {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  cuisine: string;
}

const P = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;

const IMG = {
  rice:      P("7426748"),
  curry:     P("2474661"),
  roti:      P("9609835"),
  indian:    P("5560763"),
  pasta:     P("1460872"),
  sandwich:  P("2097090"),
  breakfast: P("566564"),
  noodles:   P("699953"),
  salad:     P("1640777"),
  chicken:   P("2338407"),
  soup:      P("539451"),
  bread:     P("1549897"),
  tacos:     P("2087748"),
  japanese:  P("15108364"),
  korean:    P("37309226"),
  chinese:   P("34772941"),
  omelette:  P("4449068"),
  cereal:    P("1382102"),
  oatmeal:   P("3026804"),
  comfort:   P("1640774"),
  fish:      P("28503597"),
  egg:       P("6275164"),
  snack:     P("5191842"),
  african:   P("17502263"),
  western:   P("824635"),
  mexican:   P("17274222"),
  greek:     P("1640777"),
  french:    P("580606"),
  pancakes:  P("7144310"),
  poha:      P("6260921"),
};

export const RECIPES: Recipe[] = [

  // ═══════════════════════════════════════════════════
  // INDIAN
  // ═══════════════════════════════════════════════════

  // ── Indian Breakfast ─────────────────────────────
  { id:"b_in1", name:"Idli with Sambar", mealType:"breakfast", image:IMG.indian,
    calories:310, protein:11, carbs:58, fat:4, prepTime:20,
    ingredients:["6 idli","1 cup sambar","2 tbsp coconut chutney","1 tsp ghee"],
    instructions:["Steam idli 12 min.","Heat sambar with vegetables.","Serve hot with chutney and a drop of ghee."],
    tags:["vegetarian","gluten-free"], cuisine:"indian" },

  { id:"b_in2", name:"Masala Dosa", mealType:"breakfast", image:IMG.indian,
    calories:380, protein:9, carbs:62, fat:11, prepTime:25,
    ingredients:["dosa batter (rice & lentil)","2 boiled potatoes","1 onion","mustard seeds","curry leaves","turmeric","coconut chutney","sambar"],
    instructions:["Make aloo masala: temper mustard seeds, fry onion, mash potato with turmeric.","Spread thin dosa on tawa.","Add masala in centre, fold and serve with chutney."],
    tags:["vegetarian","gluten-free"], cuisine:"indian" },

  { id:"b_in3", name:"Aloo Paratha with Curd", mealType:"breakfast", image:IMG.roti,
    calories:460, protein:12, carbs:68, fat:16, prepTime:25,
    ingredients:["2 wheat parathas","2 boiled potatoes","cumin","green chilli","coriander","ghee","1 cup plain curd","pickle"],
    instructions:["Mix mashed potato with spices.","Stuff into rolled dough, flatten.","Cook on tawa with ghee both sides.","Serve with curd and pickle."],
    tags:["vegetarian"], cuisine:"indian" },

  { id:"b_in4", name:"Poha", mealType:"breakfast", image:IMG.poha,
    calories:320, protein:8, carbs:55, fat:8, prepTime:15,
    ingredients:["1.5 cups thick poha (beaten rice)","1 onion","1 small potato","mustard seeds","curry leaves","turmeric","peanuts","lemon juice","coriander"],
    instructions:["Rinse poha until soft, drain.","Temper mustard seeds and curry leaves.","Add onion, potato, cook 5 min.","Mix in poha and turmeric.","Finish with lemon and coriander."],
    tags:["vegetarian","quick","gluten-free"], cuisine:"indian" },

  { id:"b_in5", name:"Upma", mealType:"breakfast", image:IMG.poha,
    calories:290, protein:7, carbs:48, fat:8, prepTime:15,
    ingredients:["1 cup semolina (rava)","1 onion","mustard seeds","curry leaves","green chilli","mixed veg (carrot, peas)","ghee","lemon"],
    instructions:["Dry roast semolina until light golden.","Temper mustard seeds, fry onion and veg 3 min.","Add 2 cups boiling water, pour semolina, stir.","Cover and cook 3 min. Squeeze lemon."],
    tags:["vegetarian","quick"], cuisine:"indian" },

  { id:"b_in6", name:"Bread Omelette", mealType:"breakfast", image:IMG.omelette,
    calories:380, protein:18, carbs:30, fat:18, prepTime:10,
    ingredients:["3 eggs","2 slices bread","1 onion (chopped)","1 green chilli","1 tomato","coriander","butter","salt & pepper"],
    instructions:["Beat eggs with onion, chilli, tomato and coriander.","Cook omelette in butter.","Place bread on top while soft, flip together.","Serve with ketchup."],
    tags:["high-protein","quick"], cuisine:"indian" },

  { id:"b_in7", name:"Puri Bhaji", mealType:"breakfast", image:IMG.roti,
    calories:520, protein:11, carbs:78, fat:18, prepTime:30,
    ingredients:["4 puris (fried wheat bread)","3 boiled potatoes","1 onion","tomato","cumin seeds","turmeric","coriander powder","oil"],
    instructions:["Fry onion, add tomato and spices.","Add mashed potato, cook 5 min.","Deep fry puri dough rounds until puffed.","Serve puri with aloo bhaji."],
    tags:["vegetarian"], cuisine:"indian" },

  { id:"b_in8", name:"Besan Chilla", mealType:"breakfast", image:IMG.omelette,
    calories:300, protein:12, carbs:38, fat:10, prepTime:15,
    ingredients:["1 cup besan (chickpea flour)","1 onion (chopped)","green chilli","coriander","ajwain","turmeric","oil","curd or chutney to serve"],
    instructions:["Mix besan with onion, chilli, coriander and spices. Add water to make thin batter.","Cook like pancakes on oiled tawa.","Serve with green chutney or curd."],
    tags:["vegetarian","gluten-free","high-protein","quick"], cuisine:"indian" },

  // ── Indian Lunch ─────────────────────────────────
  { id:"l_in1", name:"Dal Chawal", mealType:"lunch", image:IMG.rice,
    calories:520, protein:19, carbs:88, fat:9, prepTime:30,
    ingredients:["1 cup toor dal","1.5 cups basmati rice","1 tomato","1 onion","garlic","ginger","cumin","turmeric","ghee","coriander"],
    instructions:["Pressure cook dal with tomato and turmeric.","Cook rice separately.","Make tadka: heat ghee, fry cumin and garlic until golden.","Pour tadka over dal. Serve with rice and pickle."],
    tags:["vegetarian","gluten-free","high-fibre"], cuisine:"indian" },

  { id:"l_in2", name:"Rajma Chawal", mealType:"lunch", image:IMG.curry,
    calories:580, protein:22, carbs:96, fat:10, prepTime:40,
    ingredients:["1 cup kidney beans (soaked overnight)","1.5 cups rice","2 tomatoes","1 onion","ginger-garlic paste","rajma masala","ghee","coriander"],
    instructions:["Pressure cook kidney beans.","Fry onion until golden, add paste, tomato and masala.","Add beans, simmer 15 min.","Serve over plain rice with curd on side."],
    tags:["vegetarian","high-protein","gluten-free"], cuisine:"indian" },

  { id:"l_in3", name:"Chole Chawal", mealType:"lunch", image:IMG.curry,
    calories:560, protein:20, carbs:92, fat:10, prepTime:35,
    ingredients:["1 cup chickpeas (soaked overnight)","1.5 cups rice","2 tomatoes","1 onion","chole masala","ginger-garlic paste","ghee","lemon"],
    instructions:["Pressure cook chickpeas.","Fry onion deep brown, add tomato and masala.","Add chickpeas, cook 15 min.","Serve over rice with sliced onion and lemon."],
    tags:["vegan","gluten-free","high-fibre"], cuisine:"indian" },

  { id:"l_in4", name:"Egg Curry with Rice", mealType:"lunch", image:IMG.curry,
    calories:530, protein:24, carbs:72, fat:16, prepTime:25,
    ingredients:["4 boiled eggs","1.5 cups rice","2 tomatoes","1 onion","ginger-garlic paste","cumin","garam masala","oil","coriander"],
    instructions:["Lightly fry boiled eggs and set aside.","Cook onion golden, add paste and spices.","Add tomato, cook 8 min.","Add eggs in gravy, simmer 10 min.","Serve over rice."],
    tags:["gluten-free","high-protein"], cuisine:"indian" },

  { id:"l_in5", name:"Chicken Curry with Rice", mealType:"lunch", image:IMG.curry,
    calories:620, protein:38, carbs:72, fat:18, prepTime:40,
    ingredients:["400g chicken","1.5 cups rice","2 onions","2 tomatoes","ginger-garlic paste","coriander powder","cumin","garam masala","oil"],
    instructions:["Fry onion deep brown.","Add paste, tomato and spices, cook 8 min.","Add chicken, fry 5 min.","Add water, cover and cook 20 min.","Serve with plain rice."],
    tags:["gluten-free","high-protein"], cuisine:"indian" },

  { id:"l_in6", name:"Sambar Rice", mealType:"lunch", image:IMG.rice,
    calories:480, protein:16, carbs:84, fat:8, prepTime:30,
    ingredients:["1.5 cups rice","1 cup toor dal","drumstick, brinjal, tomato","sambar powder","tamarind paste","mustard seeds","curry leaves","ghee"],
    instructions:["Cook rice and dal together in cooker.","Make sambar with vegetables, tamarind and powder.","Mix together with ghee tadka.","Serve with papad."],
    tags:["vegan","gluten-free"], cuisine:"indian" },

  { id:"l_in7", name:"Curd Rice", mealType:"lunch", image:IMG.rice,
    calories:420, protein:13, carbs:72, fat:9, prepTime:15,
    ingredients:["1.5 cups cooked rice","1 cup thick curd (yogurt)","mustard seeds","curry leaves","green chilli","ginger","pomegranate (optional)","salt"],
    instructions:["Cool rice slightly. Mix with curd until creamy.","Heat oil, pop mustard seeds, add curry leaves, chilli and ginger.","Pour tadka over curd rice.","Serve with mango pickle."],
    tags:["vegetarian","gluten-free","quick"], cuisine:"indian" },

  { id:"l_in8", name:"Fish Curry with Rice", mealType:"lunch", image:IMG.fish,
    calories:510, protein:32, carbs:68, fat:13, prepTime:30,
    ingredients:["400g fish (rohu or tilapia)","1.5 cups rice","coconut milk","2 tomatoes","onion","mustard seeds","curry leaves","turmeric","red chilli","tamarind"],
    instructions:["Temper mustard seeds and curry leaves.","Add onion, tomato and spices.","Pour coconut milk and tamarind, simmer.","Add fish, cook gently 8 min.","Serve over rice."],
    tags:["gluten-free","high-protein"], cuisine:"indian" },

  { id:"l_in9", name:"Vegetable Biryani", mealType:"lunch", image:IMG.rice,
    calories:540, protein:13, carbs:94, fat:14, prepTime:45,
    ingredients:["1.5 cups basmati rice","mixed veg (potato, carrot, peas, beans)","onion","biryani masala","ghee","saffron milk","fried onion","mint leaves"],
    instructions:["Par-cook rice and veg separately.","Layer in pot with spices, ghee and saffron milk.","Dum cook on low 20 min.","Serve with raita."],
    tags:["vegetarian","gluten-free"], cuisine:"indian" },

  { id:"l_in10", name:"Dal Khichdi", mealType:"lunch", image:IMG.rice,
    calories:450, protein:16, carbs:76, fat:9, prepTime:20,
    ingredients:["¾ cup rice","¼ cup moong dal","½ onion","1 tomato","cumin seeds","turmeric","ghee","salt"],
    instructions:["Pressure cook rice, dal, onion, tomato and spices together.","Mash lightly, adjust water.","Top with ghee. Serve with pickle or papad."],
    tags:["vegetarian","gluten-free","quick"], cuisine:"indian" },

  // ── Indian Dinner ─────────────────────────────────
  { id:"d_in1", name:"Dal Tadka with Roti", mealType:"dinner", image:IMG.roti,
    calories:480, protein:18, carbs:74, fat:12, prepTime:30,
    ingredients:["1 cup yellow moong dal","4 roti","1 onion","garlic cloves","cumin seeds","dry red chilli","ghee","turmeric"],
    instructions:["Boil dal with turmeric and salt.","Make tadka: heat ghee, fry cumin, garlic, red chilli.","Pour over dal.","Serve with hot roti."],
    tags:["vegetarian","gluten-free"], cuisine:"indian" },

  { id:"d_in2", name:"Paneer Butter Masala with Roti", mealType:"dinner", image:IMG.curry,
    calories:580, protein:24, carbs:56, fat:28, prepTime:35,
    ingredients:["250g paneer","4 roti","2 tomatoes","1 onion","cashews","cream","butter","ginger-garlic paste","kashmiri chilli","garam masala","dried fenugreek"],
    instructions:["Blend boiled tomato, onion and cashews smooth.","Cook in butter with spices 10 min.","Add cubed paneer and cream, simmer 5 min.","Finish with dried fenugreek. Serve with roti."],
    tags:["vegetarian"], cuisine:"indian" },

  { id:"d_in3", name:"Aloo Gobi Sabzi Roti", mealType:"dinner", image:IMG.roti,
    calories:420, protein:12, carbs:66, fat:12, prepTime:25,
    ingredients:["2 potatoes","1 small cauliflower","4 roti","cumin seeds","turmeric","coriander powder","amchur","green chilli","oil"],
    instructions:["Fry cumin in oil.","Add potato, cook 5 min.","Add cauliflower and all spices, mix well.","Cover on low 15 min.","Serve dry sabzi with hot roti."],
    tags:["vegan","gluten-free"], cuisine:"indian" },

  { id:"d_in4", name:"Butter Chicken with Naan", mealType:"dinner", image:IMG.curry,
    calories:650, protein:38, carbs:58, fat:26, prepTime:40,
    ingredients:["400g chicken","2 naan","tomato puree","cream","butter","onion","ginger-garlic paste","kashmiri chilli","garam masala","dried fenugreek"],
    instructions:["Marinate chicken in spices, grill or pan-fry.","Cook tomato puree in butter with onion paste and spices.","Add cream and chicken, simmer 10 min.","Finish with fenugreek. Serve with naan."],
    tags:["high-protein"], cuisine:"indian" },

  { id:"d_in5", name:"Palak Paneer with Roti", mealType:"dinner", image:IMG.curry,
    calories:490, protein:22, carbs:48, fat:24, prepTime:30,
    ingredients:["250g paneer","4 roti","4 cups spinach (palak)","1 onion","2 tomatoes","cream","garlic","ginger","cumin","garam masala"],
    instructions:["Blanch spinach, blend smooth.","Cook onion, garlic, tomato and spices.","Add spinach puree, simmer 8 min.","Add paneer cubes, finish with cream.","Serve with roti."],
    tags:["vegetarian","gluten-free"], cuisine:"indian" },

  { id:"d_in6", name:"Dal Makhani with Rice", mealType:"dinner", image:IMG.curry,
    calories:540, protein:20, carbs:78, fat:16, prepTime:50,
    ingredients:["1 cup whole black urad dal","¼ cup kidney beans","1.5 cups rice","butter","cream","tomato puree","onion","ginger-garlic paste","garam masala"],
    instructions:["Slow cook soaked dal and beans until very soft.","Add butter, tomato puree and spices, simmer 20 min.","Finish with cream. Serve with steamed rice."],
    tags:["vegetarian","gluten-free"], cuisine:"indian" },

  { id:"d_in7", name:"Kadhi Chawal", mealType:"dinner", image:IMG.rice,
    calories:480, protein:14, carbs:76, fat:14, prepTime:30,
    ingredients:["1 cup curd (yogurt)","2 tbsp besan (chickpea flour)","1.5 cups rice","mustard seeds","curry leaves","dry red chilli","ghee","cumin","turmeric"],
    instructions:["Whisk curd with besan and water.","Simmer until thick, stirring constantly.","Make tadka with mustard, cumin, curry leaves.","Pour over kadhi. Serve with plain rice."],
    tags:["vegetarian","gluten-free"], cuisine:"indian" },

  { id:"d_in8", name:"Egg Bhurji with Roti", mealType:"dinner", image:IMG.omelette,
    calories:440, protein:24, carbs:46, fat:18, prepTime:15,
    ingredients:["4 eggs","4 roti","1 onion","1 tomato","green chilli","coriander","turmeric","cumin seeds","oil","salt & pepper"],
    instructions:["Fry cumin, add onion until soft.","Add tomato, chilli, turmeric and cook 3 min.","Scramble eggs into the masala, stir constantly.","Finish with coriander. Serve with roti."],
    tags:["high-protein","quick"], cuisine:"indian" },

  { id:"d_in9", name:"Simple Sabzi Roti", mealType:"dinner", image:IMG.roti,
    calories:400, protein:11, carbs:64, fat:11, prepTime:25,
    ingredients:["4 roti","2 cups mixed veg (beans, peas, carrot, capsicum)","1 onion","1 tomato","cumin seeds","coriander powder","turmeric","oil"],
    instructions:["Fry cumin, add onion until translucent.","Add tomato and spices, cook 5 min.","Add vegetables, cover and cook 12 min.","Serve dry sabzi with fresh roti."],
    tags:["vegan","vegetarian","quick"], cuisine:"indian" },

  { id:"d_in10", name:"Chicken Biryani", mealType:"dinner", image:IMG.rice,
    calories:680, protein:40, carbs:82, fat:18, prepTime:60,
    ingredients:["400g chicken","1.5 cups basmati rice","onion (fried crispy)","biryani masala","curd","ginger-garlic paste","saffron milk","ghee","mint leaves"],
    instructions:["Marinate chicken in curd and spices 30 min.","Par-cook rice.","Layer chicken and rice in pot.","Cook on dum (low) 25 min.","Serve with raita and salad."],
    tags:["gluten-free","high-protein"], cuisine:"indian" },

  // ── Indian Snacks ─────────────────────────────────
  { id:"s_in1", name:"Samosa", mealType:"snack", image:IMG.snack,
    calories:250, protein:6, carbs:32, fat:12, prepTime:40,
    ingredients:["samosa pastry","2 boiled potatoes","peas","cumin","coriander","amchur","green chilli","oil for frying"],
    instructions:["Make spiced potato filling.","Stuff pastry into cone, seal.","Deep fry until golden. Serve with chutney."],
    tags:["vegetarian"], cuisine:"indian" },

  { id:"s_in2", name:"Onion Pakora", mealType:"snack", image:IMG.snack,
    calories:220, protein:6, carbs:26, fat:10, prepTime:15,
    ingredients:["2 large onions (sliced)","1 cup besan","green chilli","coriander","ajwain","red chilli","oil for frying"],
    instructions:["Mix onion, besan and spices with a little water.","Drop spoonfuls into hot oil.","Fry until golden and crispy. Serve with chutney."],
    tags:["vegetarian","quick"], cuisine:"indian" },

  { id:"s_in3", name:"Bread Pakora", mealType:"snack", image:IMG.snack,
    calories:260, protein:8, carbs:34, fat:11, prepTime:15,
    ingredients:["4 slices bread","1 cup besan","aloo masala filling (optional)","green chilli","turmeric","ajwain","oil for frying"],
    instructions:["Make thick besan batter with spices.","Dip bread slices in batter.","Fry in hot oil until golden.","Serve with ketchup or chutney."],
    tags:["vegetarian","quick"], cuisine:"indian" },

  { id:"s_in4", name:"Roasted Chana", mealType:"snack", image:IMG.snack,
    calories:180, protein:10, carbs:28, fat:4, prepTime:5,
    ingredients:["1 cup roasted chana (chickpeas)","chaat masala","lemon juice","salt"],
    instructions:["Toss roasted chana with chaat masala and lemon.","Serve immediately as a quick snack."],
    tags:["vegan","gluten-free","high-protein","quick"], cuisine:"indian" },

  { id:"s_in5", name:"Bhel Puri", mealType:"snack", image:IMG.snack,
    calories:200, protein:5, carbs:36, fat:5, prepTime:10,
    ingredients:["2 cups puffed rice","sev","boiled potato","onion","tomato","tamarind chutney","green chutney","chaat masala","coriander"],
    instructions:["Mix puffed rice, sev, potato, onion and tomato.","Add both chutneys and chaat masala.","Toss well and serve immediately."],
    tags:["vegan","quick"], cuisine:"indian" },

  { id:"s_in6", name:"Chai & Biscuits", mealType:"snack", image:IMG.snack,
    calories:150, protein:3, carbs:24, fat:5, prepTime:5,
    ingredients:["1 cup strong masala chai","4 Marie or Parle-G biscuits"],
    instructions:["Brew chai with ginger, cardamom and milk.","Serve hot with biscuits for dipping."],
    tags:["vegetarian","quick"], cuisine:"indian" },

  // ═══════════════════════════════════════════════════
  // AMERICAN / CANADIAN
  // ═══════════════════════════════════════════════════

  { id:"b_us1", name:"Scrambled Eggs & Toast", mealType:"breakfast", image:IMG.western,
    calories:380, protein:18, carbs:32, fat:18, prepTime:10,
    ingredients:["3 eggs","2 slices toast","butter","salt & pepper","optional: slice of cheese or bacon"],
    instructions:["Crack eggs into pan with butter, stir on low heat.","Toast bread.","Serve eggs on toast with salt and pepper."],
    tags:["high-protein","quick"], cuisine:"american" },

  { id:"b_us2", name:"Cereal with Milk", mealType:"breakfast", image:IMG.cereal,
    calories:380, protein:12, carbs:68, fat:6, prepTime:3,
    ingredients:["1.5 cups whole-grain cereal","1.5 cups whole milk","1 banana","handful blueberries"],
    instructions:["Pour cereal into bowl.","Add cold milk.","Slice banana on top with berries."],
    tags:["vegetarian","quick"], cuisine:"american" },

  { id:"b_us3", name:"Pancakes with Maple Syrup", mealType:"breakfast", image:IMG.pancakes,
    calories:520, protein:14, carbs:82, fat:14, prepTime:20,
    ingredients:["1 cup flour","1 egg","1 cup milk","2 tbsp sugar","1 tsp baking powder","butter","maple syrup"],
    instructions:["Mix batter until just combined.","Cook pancakes on buttered pan 2 min per side.","Stack and pour maple syrup over."],
    tags:["vegetarian"], cuisine:"american" },

  { id:"b_us4", name:"Bagel with Cream Cheese", mealType:"breakfast", image:IMG.breakfast,
    calories:460, protein:14, carbs:62, fat:16, prepTime:5,
    ingredients:["1 everything bagel","3 tbsp cream cheese","tomato slice","salt & pepper"],
    instructions:["Toast bagel.","Spread cream cheese on both halves.","Top with tomato and season."],
    tags:["vegetarian","quick"], cuisine:"american" },

  { id:"b_us5", name:"Instant Oatmeal with Brown Sugar", mealType:"breakfast", image:IMG.oatmeal,
    calories:340, protein:9, carbs:62, fat:6, prepTime:5,
    ingredients:["1.5 cups rolled oats","2 cups milk or water","1 tbsp brown sugar","banana","pinch cinnamon"],
    instructions:["Cook oats in milk on stove 3–4 min.","Stir in brown sugar and cinnamon.","Top with sliced banana."],
    tags:["vegetarian","high-fibre","quick"], cuisine:"american" },

  { id:"b_us6", name:"Avocado Toast with Egg", mealType:"breakfast", image:IMG.western,
    calories:420, protein:16, carbs:36, fat:24, prepTime:10,
    ingredients:["2 slices sourdough bread","1 avocado","2 eggs","salt","chilli flakes","lemon juice"],
    instructions:["Toast bread.","Mash avocado with lemon, salt and chilli.","Fry or poach eggs.","Spread avo on toast, top with egg."],
    tags:["vegetarian","high-protein","quick"], cuisine:"american" },

  { id:"l_us1", name:"Turkey & Cheese Sandwich", mealType:"lunch", image:IMG.sandwich,
    calories:490, protein:28, carbs:48, fat:18, prepTime:5,
    ingredients:["2 slices whole wheat bread","100g deli turkey","2 slices cheddar","lettuce","tomato","mustard","mayo"],
    instructions:["Layer turkey and cheese on bread.","Add lettuce, tomato and condiments.","Close and cut diagonally. Serve with chips or apple."],
    tags:["quick","high-protein"], cuisine:"american" },

  { id:"l_us2", name:"Grilled Cheese & Tomato Soup", mealType:"lunch", image:IMG.soup,
    calories:560, protein:18, carbs:60, fat:26, prepTime:15,
    ingredients:["2 slices white bread","3 slices American cheese","butter","1 can tomato soup","milk","salt & pepper"],
    instructions:["Butter outside of bread, layer cheese inside.","Cook in pan on medium 3 min per side until golden.","Heat soup with splash of milk.","Serve together."],
    tags:["vegetarian","quick"], cuisine:"american" },

  { id:"l_us3", name:"PB&J Sandwich", mealType:"lunch", image:IMG.sandwich,
    calories:420, protein:12, carbs:56, fat:18, prepTime:3,
    ingredients:["2 slices bread","2 tbsp peanut butter","1 tbsp strawberry jam","banana (side)"],
    instructions:["Spread peanut butter on one slice, jam on other.","Press together. Serve with banana."],
    tags:["vegetarian","quick"], cuisine:"american" },

  { id:"l_us4", name:"Mac & Cheese (Box)", mealType:"lunch", image:IMG.comfort,
    calories:550, protein:16, carbs:78, fat:18, prepTime:12,
    ingredients:["1 box mac & cheese (or homemade pasta)","milk","butter","shredded cheddar","black pepper","optional: hot sauce"],
    instructions:["Cook pasta until tender, drain.","Stir in butter, milk and cheese powder or shredded cheese.","Season with pepper and hot sauce."],
    tags:["vegetarian","quick"], cuisine:"american" },

  { id:"l_us5", name:"BLT Sandwich", mealType:"lunch", image:IMG.sandwich,
    calories:510, protein:18, carbs:44, fat:28, prepTime:10,
    ingredients:["2 slices toast","4 strips bacon","2 lettuce leaves","2 tomato slices","mayo","black pepper"],
    instructions:["Fry bacon until crispy.","Toast bread, spread mayo.","Layer bacon, lettuce and tomato.","Season and serve."],
    tags:["quick","high-protein"], cuisine:"american" },

  { id:"l_us6", name:"Caesar Salad with Chicken", mealType:"lunch", image:IMG.salad,
    calories:490, protein:34, carbs:22, fat:28, prepTime:15,
    ingredients:["2 cups romaine lettuce","200g grilled chicken breast","croutons","parmesan","Caesar dressing (bottled)","black pepper"],
    instructions:["Slice grilled chicken.","Toss lettuce with dressing and croutons.","Top with chicken and parmesan."],
    tags:["high-protein","quick"], cuisine:"american" },

  { id:"d_us1", name:"Spaghetti Bolognese", mealType:"dinner", image:IMG.pasta,
    calories:680, protein:36, carbs:82, fat:20, prepTime:35,
    ingredients:["300g spaghetti","250g ground beef","1 jar marinara sauce","1 onion","3 garlic cloves","Italian seasoning","parmesan","olive oil"],
    instructions:["Brown beef with onion and garlic.","Add marinara and simmer 15 min.","Cook spaghetti, toss with sauce.","Top with parmesan."],
    tags:["high-protein"], cuisine:"american" },

  { id:"d_us2", name:"Baked Mac & Cheese", mealType:"dinner", image:IMG.comfort,
    calories:660, protein:24, carbs:76, fat:28, prepTime:40,
    ingredients:["300g elbow macaroni","2 cups cheddar","butter","flour","2 cups milk","mustard powder","breadcrumbs","paprika"],
    instructions:["Make cheese sauce: butter + flour + milk + cheese.","Toss with cooked pasta.","Top with breadcrumbs.","Bake 220°C 20 min until bubbly."],
    tags:["vegetarian"], cuisine:"american" },

  { id:"d_us3", name:"Sheet Pan Chicken & Veggies", mealType:"dinner", image:IMG.chicken,
    calories:540, protein:42, carbs:32, fat:24, prepTime:40,
    ingredients:["4 chicken thighs","2 potatoes (cubed)","1 bell pepper","1 zucchini","olive oil","garlic powder","paprika","Italian herbs","salt & pepper"],
    instructions:["Toss everything in olive oil and spices.","Spread on sheet pan.","Roast at 220°C 35 min until golden."],
    tags:["gluten-free","high-protein"], cuisine:"american" },

  { id:"d_us4", name:"Ground Beef Tacos", mealType:"dinner", image:IMG.tacos,
    calories:580, protein:34, carbs:48, fat:26, prepTime:20,
    ingredients:["250g ground beef","8 small tortillas","taco seasoning","shredded lettuce","diced tomato","shredded cheddar","sour cream","salsa"],
    instructions:["Brown beef, add taco seasoning.","Warm tortillas.","Fill with beef and all toppings."],
    tags:["quick"], cuisine:"american" },

  { id:"d_us5", name:"Hamburger & Fries", mealType:"dinner", image:IMG.western,
    calories:780, protein:36, carbs:72, fat:38, prepTime:30,
    ingredients:["250g ground beef patty","burger bun","cheddar slice","lettuce","tomato","onion","ketchup","mustard","fries (frozen or cut)"],
    instructions:["Season and grill patty 3 min per side.","Toast bun.","Layer with cheese, veg and condiments.","Serve with baked fries."],
    tags:["high-protein"], cuisine:"american" },

  { id:"d_us6", name:"Roast Chicken & Mashed Potatoes", mealType:"dinner", image:IMG.chicken,
    calories:660, protein:44, carbs:52, fat:26, prepTime:60,
    ingredients:["4 chicken pieces","4 large potatoes","butter","milk","garlic powder","paprika","rosemary","salt & pepper"],
    instructions:["Season chicken with spices and roast 45 min at 200°C.","Boil potatoes, mash with butter and warm milk.","Serve chicken over mash with pan juices."],
    tags:["gluten-free","high-protein"], cuisine:"american" },

  { id:"d_us7", name:"Simple Pasta with Marinara", mealType:"dinner", image:IMG.pasta,
    calories:520, protein:16, carbs:88, fat:10, prepTime:20,
    ingredients:["300g pasta (penne or spaghetti)","1 jar marinara sauce","garlic","olive oil","parmesan","basil","salt"],
    instructions:["Cook pasta.","Heat marinara with garlic in olive oil 10 min.","Toss pasta in sauce.","Top with parmesan and basil."],
    tags:["vegetarian","quick"], cuisine:"american" },

  { id:"d_us8", name:"Baked Potato with Chili", mealType:"dinner", image:IMG.comfort,
    calories:600, protein:26, carbs:82, fat:14, prepTime:65,
    ingredients:["2 large potatoes","1 can chili (or homemade: beef, beans, tomato)","sour cream","shredded cheddar","green onion"],
    instructions:["Bake potatoes at 200°C 60 min or microwave 8 min.","Heat chili.","Cut open potato, load with chili, cheese and sour cream."],
    tags:["gluten-free","high-fibre"], cuisine:"american" },

  { id:"s_us1", name:"Apple & Peanut Butter", mealType:"snack", image:IMG.snack,
    calories:230, protein:6, carbs:30, fat:10, prepTime:3,
    ingredients:["1 large apple","2 tbsp peanut butter"],
    instructions:["Slice apple.","Serve with peanut butter for dipping."],
    tags:["vegan","gluten-free","quick"], cuisine:"american" },

  { id:"s_us2", name:"Chips & Salsa", mealType:"snack", image:IMG.snack,
    calories:220, protein:3, carbs:34, fat:8, prepTime:2,
    ingredients:["tortilla chips","½ cup store-bought salsa","optional: guacamole"],
    instructions:["Open chips.","Pour salsa into bowl.","Dip and enjoy."],
    tags:["vegan","gluten-free","quick"], cuisine:"american" },

  { id:"s_us3", name:"Granola Bar & Banana", mealType:"snack", image:IMG.snack,
    calories:250, protein:5, carbs:44, fat:7, prepTime:1,
    ingredients:["1 store-bought granola bar","1 banana"],
    instructions:["Eat granola bar and banana together as a quick snack."],
    tags:["vegetarian","vegan","quick"], cuisine:"american" },

  { id:"s_us4", name:"Yogurt with Granola", mealType:"snack", image:IMG.snack,
    calories:270, protein:12, carbs:38, fat:6, prepTime:3,
    ingredients:["1 cup Greek yogurt","¼ cup granola","handful berries","drizzle honey"],
    instructions:["Spoon yogurt into bowl.","Top with granola, berries and honey."],
    tags:["vegetarian","high-protein","quick"], cuisine:"american" },

  // ═══════════════════════════════════════════════════
  // BRITISH
  // ═══════════════════════════════════════════════════

  { id:"b_uk1", name:"Full English Breakfast", mealType:"breakfast", image:IMG.breakfast,
    calories:650, protein:34, carbs:36, fat:40, prepTime:20,
    ingredients:["2 eggs","2 rashers bacon","1 sausage","1 slice toast","baked beans","grilled tomato","mushrooms","butter"],
    instructions:["Grill sausage and bacon.","Fry eggs in butter.","Heat beans.","Grill tomato and mushrooms.","Serve everything on one plate with toast."],
    tags:["high-protein"], cuisine:"european" },

  { id:"b_uk2", name:"Beans on Toast", mealType:"breakfast", image:IMG.bread,
    calories:380, protein:16, carbs:62, fat:6, prepTime:8,
    ingredients:["2 slices thick white bread","1 can baked beans","butter","optional: poached egg","black pepper"],
    instructions:["Toast bread and butter it.","Heat beans in pan.","Pour over toast. Season with pepper."],
    tags:["vegetarian","quick","high-fibre"], cuisine:"european" },

  { id:"b_uk3", name:"Porridge with Honey", mealType:"breakfast", image:IMG.oatmeal,
    calories:340, protein:10, carbs:58, fat:7, prepTime:8,
    ingredients:["1 cup rolled oats","2 cups whole milk","1 tbsp honey","handful raspberries or banana","pinch salt"],
    instructions:["Simmer oats in milk with salt 5 min, stirring.","Pour into bowl, drizzle honey and scatter fruit."],
    tags:["vegetarian","quick","high-fibre"], cuisine:"european" },

  { id:"b_uk4", name:"Eggy Bread (French Toast)", mealType:"breakfast", image:IMG.breakfast,
    calories:420, protein:16, carbs:44, fat:18, prepTime:12,
    ingredients:["2 thick slices bread","2 eggs","splash milk","butter","pinch cinnamon","jam or maple syrup to serve"],
    instructions:["Beat eggs with milk and cinnamon.","Soak bread in egg mixture.","Fry in butter 2 min per side until golden.","Serve with jam or syrup."],
    tags:["vegetarian","quick"], cuisine:"european" },

  { id:"b_uk5", name:"Toast & Marmalade", mealType:"breakfast", image:IMG.bread,
    calories:300, protein:7, carbs:52, fat:8, prepTime:5,
    ingredients:["2 slices bread","butter","orange marmalade","cup of tea"],
    instructions:["Toast bread.","Spread butter then marmalade.","Serve with strong tea and milk."],
    tags:["vegetarian","quick"], cuisine:"european" },

  { id:"l_uk1", name:"Jacket Potato with Beans & Cheese", mealType:"lunch", image:IMG.comfort,
    calories:580, protein:20, carbs:88, fat:14, prepTime:60,
    ingredients:["2 large baking potatoes","1 can baked beans","50g cheddar (grated)","butter","side salad"],
    instructions:["Bake potatoes at 200°C 55 min or microwave 8 min.","Cut open, add butter.","Top with hot beans and grated cheese.","Serve with salad."],
    tags:["vegetarian","high-fibre"], cuisine:"european" },

  { id:"l_uk2", name:"Cheese & Pickle Sandwich", mealType:"lunch", image:IMG.sandwich,
    calories:460, protein:16, carbs:50, fat:22, prepTime:5,
    ingredients:["2 slices wholemeal bread","2 slices mature cheddar","1 tbsp Branston pickle","handful crisps","apple"],
    instructions:["Spread pickle on bread, layer cheese.","Close sandwich. Serve with crisps and apple."],
    tags:["vegetarian","quick"], cuisine:"european" },

  { id:"l_uk3", name:"Tuna Mayo Sandwich", mealType:"lunch", image:IMG.sandwich,
    calories:480, protein:26, carbs:44, fat:20, prepTime:8,
    ingredients:["2 slices bread","1 can tuna (drained)","2 tbsp mayo","sweetcorn","red onion","lettuce","black pepper"],
    instructions:["Mix tuna with mayo, sweetcorn and onion.","Season with pepper.","Load onto bread with lettuce."],
    tags:["quick","high-protein"], cuisine:"european" },

  { id:"l_uk4", name:"Tomato Soup & Crusty Bread", mealType:"lunch", image:IMG.soup,
    calories:400, protein:10, carbs:62, fat:10, prepTime:10,
    ingredients:["1 can tomato soup","splash cream (optional)","2 slices crusty bread","butter","salt & pepper"],
    instructions:["Heat soup, stir in cream if using.","Toast or warm bread.","Serve soup in bowl with buttered bread."],
    tags:["vegetarian","quick"], cuisine:"european" },

  { id:"d_uk1", name:"Shepherd's Pie", mealType:"dinner", image:IMG.comfort,
    calories:620, protein:32, carbs:58, fat:26, prepTime:55,
    ingredients:["400g lamb or beef mince","4 large potatoes","1 onion","2 carrots","1 cup frozen peas","Worcestershire sauce","beef stock","butter","milk"],
    instructions:["Brown mince with onion, carrots, stock and Worcestershire.","Add peas, simmer 20 min.","Boil potatoes, mash with butter and milk.","Top mince with mash.","Bake 200°C 20 min until golden."],
    tags:["high-protein"], cuisine:"european" },

  { id:"d_uk2", name:"Fish & Chips", mealType:"dinner", image:IMG.fish,
    calories:720, protein:36, carbs:78, fat:28, prepTime:40,
    ingredients:["2 cod or haddock fillets","3 large potatoes","1 cup flour","cold sparkling water","baking powder","oil for frying","malt vinegar","mushy peas"],
    instructions:["Cut potatoes into chips, par-boil 5 min.","Make batter: flour, baking powder, cold water.","Fry chips until golden.","Dip fish in batter, fry 4 min per side.","Serve with vinegar and peas."],
    tags:["high-protein"], cuisine:"european" },

  { id:"d_uk3", name:"Bangers & Mash with Onion Gravy", mealType:"dinner", image:IMG.comfort,
    calories:640, protein:28, carbs:56, fat:32, prepTime:30,
    ingredients:["4 pork sausages","3 large potatoes","2 onions","butter","milk","beef stock","plain flour","Worcestershire sauce"],
    instructions:["Grill sausages 20 min.","Boil and mash potatoes with butter and milk.","Caramelise onions, stir in flour and stock for gravy.","Plate mash and sausages, pour gravy over."],
    tags:[], cuisine:"european" },

  { id:"d_uk4", name:"Chicken Tikka Masala & Rice", mealType:"dinner", image:IMG.curry,
    calories:620, protein:38, carbs:68, fat:18, prepTime:35,
    ingredients:["400g chicken","1.5 cups rice","tikka masala sauce (jar)","onion","ginger-garlic paste","cream","oil","coriander"],
    instructions:["Fry chicken until sealed.","Add onion, paste and jar sauce.","Simmer 20 min.","Stir in cream.","Serve with basmati rice."],
    tags:["gluten-free","high-protein"], cuisine:"european" },

  { id:"d_uk5", name:"Pasta Bake", mealType:"dinner", image:IMG.pasta,
    calories:600, protein:28, carbs:72, fat:20, prepTime:40,
    ingredients:["300g penne","250g ground beef or chicken","1 jar pasta sauce","100g mozzarella","parmesan","Italian seasoning"],
    instructions:["Brown meat with seasoning.","Add pasta sauce, simmer 10 min.","Mix with cooked penne.","Top with mozzarella and parmesan.","Bake 200°C 20 min."],
    tags:["high-protein"], cuisine:"european" },

  { id:"d_uk6", name:"Sausage Casserole", mealType:"dinner", image:IMG.comfort,
    calories:540, protein:26, carbs:48, fat:26, prepTime:50,
    ingredients:["4 pork sausages","1 can chopped tomatoes","1 can butter beans","1 onion","2 garlic cloves","1 cup chicken stock","paprika","herbs","crusty bread"],
    instructions:["Brown sausages, set aside.","Fry onion and garlic.","Add tomatoes, stock, beans and spices.","Add sausages, simmer 30 min.","Serve with crusty bread."],
    tags:["high-fibre"], cuisine:"european" },

  { id:"s_uk1", name:"Tea & Biscuits", mealType:"snack", image:IMG.snack,
    calories:160, protein:2, carbs:28, fat:5, prepTime:3,
    ingredients:["cup of tea","milk","3 digestive biscuits or rich tea"],
    instructions:["Brew tea.","Dunk biscuits and enjoy."],
    tags:["vegetarian","quick"], cuisine:"european" },

  { id:"s_uk2", name:"Scone with Jam & Cream", mealType:"snack", image:IMG.bread,
    calories:280, protein:5, carbs:40, fat:12, prepTime:5,
    ingredients:["1 scone","clotted cream or butter","strawberry jam","cup of tea"],
    instructions:["Slice scone in half.","Spread cream and jam.","Serve with tea."],
    tags:["vegetarian","quick"], cuisine:"european" },

  // ═══════════════════════════════════════════════════
  // FRENCH
  // ═══════════════════════════════════════════════════

  { id:"b_fr1", name:"Tartine Butter & Jam", mealType:"breakfast", image:IMG.bread,
    calories:360, protein:8, carbs:52, fat:14, prepTime:5,
    ingredients:["2 thick baguette slices","2 tbsp salted butter","2 tbsp strawberry jam","large café au lait"],
    instructions:["Slice baguette and spread generously with butter.","Add jam on top.","Enjoy with a big bowl of café au lait."],
    tags:["vegetarian","quick"], cuisine:"french" },

  { id:"b_fr2", name:"Croissant & Café au Lait", mealType:"breakfast", image:IMG.french,
    calories:420, protein:8, carbs:48, fat:22, prepTime:3,
    ingredients:["2 croissants (bakery)","large café au lait or espresso","optional: orange juice"],
    instructions:["Warm croissants in oven 3 min.","Serve with strong coffee and milk."],
    tags:["vegetarian","quick"], cuisine:"french" },

  { id:"b_fr3", name:"Yogurt & Fresh Fruit", mealType:"breakfast", image:IMG.snack,
    calories:260, protein:10, carbs:40, fat:6, prepTime:3,
    ingredients:["2 pots plain yogurt","1 banana or handful berries","drizzle honey","small bowl of cereal or muesli"],
    instructions:["Spoon yogurt into bowl.","Top with fruit and honey.","Add cereal or muesli on side."],
    tags:["vegetarian","quick","gluten-free"], cuisine:"french" },

  { id:"l_fr1", name:"Croque Monsieur", mealType:"lunch", image:IMG.sandwich,
    calories:580, protein:26, carbs:42, fat:32, prepTime:20,
    ingredients:["4 slices white bread","3 slices ham","100g gruyère (grated)","butter","flour","200ml milk","Dijon mustard"],
    instructions:["Make béchamel: butter + flour + milk until thick.","Spread mustard on bread, layer ham and cheese.","Top with béchamel and more cheese.","Bake 200°C 10 min, grill 3 min."],
    tags:["quick"], cuisine:"french" },

  { id:"l_fr2", name:"Jambon-Beurre Baguette", mealType:"lunch", image:IMG.bread,
    calories:480, protein:20, carbs:52, fat:20, prepTime:5,
    ingredients:["½ baguette","3 slices good ham","2 tbsp salted butter","optional: cornichons","optional: Dijon mustard"],
    instructions:["Slice baguette lengthwise.","Spread butter on both sides.","Layer ham, add mustard and cornichons.","Wrap in paper to go."],
    tags:["quick"], cuisine:"french" },

  { id:"l_fr3", name:"Simple Green Salad & Baguette", mealType:"lunch", image:IMG.salad,
    calories:380, protein:10, carbs:46, fat:18, prepTime:10,
    ingredients:["mixed green leaves","cherry tomatoes","1 hard-boiled egg","½ baguette with butter","Dijon vinaigrette (oil, vinegar, mustard)"],
    instructions:["Make vinaigrette by whisking mustard, vinegar and oil.","Toss leaves, tomatoes and egg in dressing.","Serve with buttered baguette."],
    tags:["vegetarian","quick"], cuisine:"french" },

  { id:"l_fr4", name:"Quiche Lorraine & Salad", mealType:"lunch", image:IMG.breakfast,
    calories:520, protein:18, carbs:36, fat:34, prepTime:50,
    ingredients:["shortcrust pastry","3 eggs","200ml cream","150g lardons (bacon cubes)","gruyère","black pepper","side salad"],
    instructions:["Bake pastry shell 10 min.","Fry lardons, scatter in shell with cheese.","Pour egg-cream mixture over.","Bake 180°C 30 min until set. Serve with salad."],
    tags:["high-protein"], cuisine:"french" },

  { id:"d_fr1", name:"Steak Frites", mealType:"dinner", image:IMG.chicken,
    calories:720, protein:48, carbs:52, fat:34, prepTime:30,
    ingredients:["300g sirloin steak","3 large potatoes (frites)","butter","garlic","thyme","Dijon mustard","green salad","oil","salt & pepper"],
    instructions:["Cut potatoes thin and fry in batches until crispy.","Season steak generously.","Sear in hot butter-oil 2–3 min per side.","Rest 3 min. Serve with frites, salad and mustard."],
    tags:["gluten-free","high-protein"], cuisine:"french" },

  { id:"d_fr2", name:"Omelette & Green Salad", mealType:"dinner", image:IMG.omelette,
    calories:420, protein:24, carbs:14, fat:30, prepTime:12,
    ingredients:["3 eggs","butter","salt & pepper","fresh herbs (chives or parsley)","side salad with vinaigrette","baguette slice"],
    instructions:["Beat eggs with herbs and season.","Cook in foamy butter on medium, folding edges.","Roll onto plate while still slightly soft.","Serve with salad and bread."],
    tags:["vegetarian","quick","gluten-free"], cuisine:"french" },

  { id:"d_fr3", name:"Pasta Crème & Lardons", mealType:"dinner", image:IMG.pasta,
    calories:620, protein:24, carbs:68, fat:28, prepTime:20,
    ingredients:["300g penne or tagliatelle","150g lardons","200ml crème fraîche","1 shallot","gruyère","Dijon mustard","parsley","black pepper"],
    instructions:["Cook pasta al dente.","Fry lardons with shallot until golden.","Stir in crème fraîche and mustard, warm through.","Toss pasta in sauce. Top with cheese and parsley."],
    tags:["quick"], cuisine:"french" },

  { id:"d_fr4", name:"Simple Roast Chicken & Veg", mealType:"dinner", image:IMG.chicken,
    calories:580, protein:44, carbs:28, fat:30, prepTime:70,
    ingredients:["1 whole chicken (or 4 pieces)","potatoes","carrots","onion","garlic","butter","thyme","rosemary","olive oil","salt & pepper"],
    instructions:["Rub chicken with butter and herbs.","Surround with chopped vegetables.","Roast at 200°C for 60 min.","Rest 10 min before serving."],
    tags:["gluten-free","high-protein"], cuisine:"french" },

  { id:"d_fr5", name:"Ratatouille & Rice", mealType:"dinner", image:IMG.salad,
    calories:430, protein:10, carbs:72, fat:12, prepTime:45,
    ingredients:["1 aubergine","2 courgettes","2 peppers","4 tomatoes","1 onion","3 garlic cloves","thyme","basil","olive oil","1.5 cups rice"],
    instructions:["Dice all vegetables.","Sauté onion and garlic, add all veg.","Add herbs, simmer 30 min until soft.","Serve over rice with bread."],
    tags:["vegan","vegetarian","gluten-free"], cuisine:"french" },

  { id:"s_fr1", name:"Yogurt", mealType:"snack", image:IMG.snack,
    calories:130, protein:8, carbs:16, fat:4, prepTime:1,
    ingredients:["1 pot plain or fruit yogurt"],
    instructions:["Eat straight from the pot — the classic French snack."],
    tags:["vegetarian","gluten-free","quick"], cuisine:"french" },

  // ═══════════════════════════════════════════════════
  // ITALIAN
  // ═══════════════════════════════════════════════════

  { id:"b_it1", name:"Cappuccino & Cornetto", mealType:"breakfast", image:IMG.french,
    calories:380, protein:7, carbs:48, fat:18, prepTime:5,
    ingredients:["1 cornetto (croissant-style pastry)","1 cappuccino","optional: small glass orange juice"],
    instructions:["Warm cornetto briefly.","Enjoy dipped into cappuccino as Italians do."],
    tags:["vegetarian","quick"], cuisine:"italian" },

  { id:"b_it2", name:"Toast with Butter & Jam", mealType:"breakfast", image:IMG.bread,
    calories:320, protein:7, carbs:50, fat:10, prepTime:5,
    ingredients:["2 slices white bread","butter","apricot or cherry jam","espresso or milk"],
    instructions:["Toast bread.","Spread butter then jam.","Serve with espresso."],
    tags:["vegetarian","quick"], cuisine:"italian" },

  { id:"l_it1", name:"Pasta al Pomodoro", mealType:"lunch", image:IMG.pasta,
    calories:480, protein:14, carbs:82, fat:10, prepTime:20,
    ingredients:["300g spaghetti or penne","1 can crushed tomatoes","2 garlic cloves","olive oil","basil","parmesan","salt"],
    instructions:["Cook garlic in olive oil, add tomatoes.","Simmer 15 min.","Cook pasta, toss with sauce.","Top with fresh basil and parmesan."],
    tags:["vegetarian","vegan","quick"], cuisine:"italian" },

  { id:"l_it2", name:"Pasta Aglio e Olio", mealType:"lunch", image:IMG.pasta,
    calories:460, protein:13, carbs:78, fat:12, prepTime:15,
    ingredients:["300g spaghetti","4 garlic cloves (sliced)","olive oil","red chilli flakes","parsley","parmesan"],
    instructions:["Cook spaghetti.","Slowly fry garlic in olive oil with chilli.","Toss pasta with garlic oil, parsley.","Serve with parmesan."],
    tags:["vegetarian","quick"], cuisine:"italian" },

  { id:"l_it3", name:"Minestrone Soup & Bread", mealType:"lunch", image:IMG.soup,
    calories:420, protein:14, carbs:64, fat:10, prepTime:30,
    ingredients:["1 can chopped tomatoes","1 can cannellini beans","mixed veg (courgette, carrot, celery, onion)","small pasta","vegetable stock","garlic","olive oil","parmesan rind","crusty bread"],
    instructions:["Fry onion, carrot, celery and garlic.","Add tomatoes, stock, vegetables and pasta.","Simmer 20 min until thick.","Serve with parmesan and crusty bread."],
    tags:["vegetarian","high-fibre"], cuisine:"italian" },

  { id:"d_it1", name:"Pasta Bolognese", mealType:"dinner", image:IMG.pasta,
    calories:660, protein:34, carbs:78, fat:20, prepTime:40,
    ingredients:["300g tagliatelle or penne","300g beef mince","1 onion","carrot","celery","1 can tomatoes","red wine (optional)","garlic","parmesan","olive oil"],
    instructions:["Brown mince with onion, carrot, celery and garlic.","Add tomatoes and wine, simmer 25 min.","Cook pasta, toss with sauce.","Serve with parmesan."],
    tags:["high-protein"], cuisine:"italian" },

  { id:"d_it2", name:"Pasta Carbonara", mealType:"dinner", image:IMG.pasta,
    calories:620, protein:28, carbs:72, fat:24, prepTime:20,
    ingredients:["300g spaghetti","150g pancetta or guanciale","3 egg yolks + 1 whole egg","pecorino romano","black pepper","salt"],
    instructions:["Fry pancetta until crispy.","Whisk eggs with pecorino and black pepper.","Cook spaghetti, reserve pasta water.","Off heat, toss pasta with egg mix and pancetta — use pasta water to loosen."],
    tags:["quick","high-protein"], cuisine:"italian" },

  { id:"d_it3", name:"Lasagna", mealType:"dinner", image:IMG.comfort,
    calories:680, protein:34, carbs:62, fat:30, prepTime:70,
    ingredients:["lasagna sheets","300g beef mince","béchamel sauce","1 can tomatoes","onion","garlic","mozzarella","parmesan"],
    instructions:["Make bolognese and béchamel.","Layer pasta, bolognese, béchamel, repeat.","Top with mozzarella and parmesan.","Bake 180°C 40 min."],
    tags:["high-protein"], cuisine:"italian" },

  { id:"d_it4", name:"Risotto al Parmigiano", mealType:"dinner", image:IMG.rice,
    calories:540, protein:16, carbs:78, fat:16, prepTime:35,
    ingredients:["1.5 cups arborio rice","1 onion","white wine","1.2L hot chicken or vegetable stock","butter","parmesan","salt & pepper"],
    instructions:["Fry onion in butter. Add rice, toast 1 min.","Add wine, then ladle stock one at a time, stirring constantly.","After 18 min, stir in butter and parmesan.","Serve immediately."],
    tags:["vegetarian"], cuisine:"italian" },

  { id:"d_it5", name:"Pizza Margherita", mealType:"dinner", image:IMG.comfort,
    calories:600, protein:22, carbs:80, fat:20, prepTime:30,
    ingredients:["pizza dough (store-bought or homemade)","½ cup tomato sauce","150g mozzarella","fresh basil","olive oil","salt"],
    instructions:["Roll dough thin.","Spread tomato sauce, add torn mozzarella.","Bake at 240°C 10–12 min until bubbly.","Top with fresh basil and olive oil."],
    tags:["vegetarian"], cuisine:"italian" },

  // ═══════════════════════════════════════════════════
  // MEXICAN
  // ═══════════════════════════════════════════════════

  { id:"b_mx1", name:"Huevos Rancheros", mealType:"breakfast", image:IMG.egg,
    calories:480, protein:22, carbs:46, fat:22, prepTime:15,
    ingredients:["2 corn tortillas","2 eggs","½ cup salsa ranchera (tomato-chilli sauce)","black beans","crumbled queso fresco","avocado","coriander"],
    instructions:["Warm tortillas in dry pan.","Fry eggs to your liking.","Heat salsa and beans.","Layer tortilla, beans, egg, salsa and toppings."],
    tags:["vegetarian","gluten-free"], cuisine:"mexican" },

  { id:"b_mx2", name:"Scrambled Eggs & Beans Tortilla", mealType:"breakfast", image:IMG.egg,
    calories:450, protein:22, carbs:50, fat:18, prepTime:10,
    ingredients:["3 eggs","2 flour tortillas","½ cup refried beans","salsa","shredded cheddar","oil"],
    instructions:["Scramble eggs.","Warm tortillas.","Spread beans, add eggs, cheese and salsa.","Roll up and eat."],
    tags:["quick","high-protein"], cuisine:"mexican" },

  { id:"l_mx1", name:"Beef Tacos", mealType:"lunch", image:IMG.tacos,
    calories:560, protein:32, carbs:52, fat:22, prepTime:20,
    ingredients:["250g ground beef","8 corn tortillas","taco seasoning","shredded lettuce","diced onion","tomato","salsa","lime","coriander"],
    instructions:["Brown beef with taco seasoning.","Warm tortillas.","Fill with beef and all toppings.","Squeeze lime over."],
    tags:["quick"], cuisine:"mexican" },

  { id:"l_mx2", name:"Chicken Quesadilla", mealType:"lunch", image:IMG.tacos,
    calories:520, protein:30, carbs:48, fat:22, prepTime:15,
    ingredients:["2 large flour tortillas","200g cooked chicken (shredded)","100g cheddar or Mexican mix","salsa","sour cream","guacamole"],
    instructions:["Layer chicken and cheese on tortilla, fold.","Cook in dry pan 2 min per side until golden.","Slice into wedges. Serve with salsa, sour cream and guac."],
    tags:["quick","high-protein"], cuisine:"mexican" },

  { id:"l_mx3", name:"Bean & Rice Burrito", mealType:"lunch", image:IMG.tacos,
    calories:580, protein:20, carbs:88, fat:14, prepTime:15,
    ingredients:["1 large flour tortilla","½ cup refried beans","½ cup cooked rice","salsa","shredded cheddar","sour cream","shredded lettuce","guacamole"],
    instructions:["Warm tortilla.","Layer all ingredients in centre.","Fold sides in, roll tightly.","Grill in pan 1 min per side to seal."],
    tags:["vegetarian","high-fibre","quick"], cuisine:"mexican" },

  { id:"d_mx1", name:"Chicken Enchiladas", mealType:"dinner", image:IMG.chicken,
    calories:620, protein:36, carbs:58, fat:24, prepTime:40,
    ingredients:["400g cooked chicken (shredded)","8 corn tortillas","2 cups red enchilada sauce","1 cup cheddar","sour cream","coriander"],
    instructions:["Fill tortillas with chicken, roll up.","Place in baking dish, pour sauce over.","Top with cheese.","Bake 180°C 20 min. Serve with sour cream."],
    tags:["high-protein","gluten-free"], cuisine:"mexican" },

  { id:"d_mx2", name:"Arroz con Pollo", mealType:"dinner", image:IMG.rice,
    calories:600, protein:38, carbs:64, fat:18, prepTime:45,
    ingredients:["4 chicken thighs","1.5 cups long grain rice","1 can tomatoes","1 onion","3 garlic cloves","bell pepper","cumin","oregano","chicken stock","oil"],
    instructions:["Brown chicken, set aside.","Fry onion, garlic and pepper.","Add rice, toast 2 min.","Add tomatoes, stock and spices.","Nestle chicken back in, cover and cook 25 min."],
    tags:["gluten-free","high-protein"], cuisine:"mexican" },

  { id:"d_mx3", name:"Simple Chicken Soup (Caldo)", mealType:"dinner", image:IMG.soup,
    calories:440, protein:36, carbs:38, fat:12, prepTime:50,
    ingredients:["4 chicken pieces","2 potatoes","2 carrots","1 zucchini","1 onion","3 garlic cloves","rice or corn (optional)","coriander","lime","salt"],
    instructions:["Simmer chicken with onion and garlic 20 min.","Add vegetables and cook 20 min more.","Season with salt.","Serve with lime, coriander and tortillas."],
    tags:["gluten-free","high-protein"], cuisine:"mexican" },

  { id:"s_mx1", name:"Guacamole & Chips", mealType:"snack", image:IMG.snack,
    calories:240, protein:3, carbs:26, fat:14, prepTime:8,
    ingredients:["2 ripe avocados","lime juice","salt","½ tomato (diced)","small onion","coriander","tortilla chips"],
    instructions:["Mash avocado with lime and salt.","Stir in tomato, onion and coriander.","Serve with chips."],
    tags:["vegan","gluten-free","quick"], cuisine:"mexican" },

  // ═══════════════════════════════════════════════════
  // JAPANESE
  // ═══════════════════════════════════════════════════

  { id:"b_jp1", name:"Rice & Miso Soup", mealType:"breakfast", image:IMG.japanese,
    calories:320, protein:12, carbs:56, fat:5, prepTime:10,
    ingredients:["1.5 cups cooked white rice","1 cup miso soup (dashi + miso paste)","silken tofu cubes","wakame seaweed","green onion"],
    instructions:["Heat dashi stock, dissolve miso paste (don't boil).","Add tofu and wakame.","Serve with a bowl of plain rice."],
    tags:["vegetarian","quick"], cuisine:"japanese" },

  { id:"b_jp2", name:"Tamago Gohan (Egg on Rice)", mealType:"breakfast", image:IMG.japanese,
    calories:350, protein:14, carbs:52, fat:10, prepTime:5,
    ingredients:["1.5 cups hot cooked rice","1 raw fresh egg","1 tsp soy sauce","sesame oil","optional: green onion"],
    instructions:["Place hot rice in bowl.","Crack raw egg on top.","Add soy sauce and sesame oil.","Mix vigorously until creamy. Top with green onion."],
    tags:["gluten-free","quick","high-protein"], cuisine:"japanese" },

  { id:"l_jp1", name:"Japanese Curry Rice", mealType:"lunch", image:IMG.japanese,
    calories:620, protein:24, carbs:88, fat:16, prepTime:35,
    ingredients:["300g chicken or beef","2 potatoes","2 carrots","1 onion","curry roux (S&B or Vermont)","1.5 cups rice"],
    instructions:["Brown meat, add onion, carrot and potato.","Add water, simmer 20 min.","Break in curry roux blocks, stir until thick.","Serve over rice."],
    tags:["high-protein"], cuisine:"japanese" },

  { id:"l_jp2", name:"Teriyaki Chicken Rice Bowl", mealType:"lunch", image:IMG.japanese,
    calories:560, protein:36, carbs:66, fat:14, prepTime:20,
    ingredients:["2 chicken thighs","1.5 cups rice","soy sauce","mirin","sugar","sesame seeds","green onion","steamed broccoli"],
    instructions:["Pan-fry chicken until cooked.","Add soy, mirin and sugar sauce, glaze 2 min.","Slice over rice. Top with sesame and green onion."],
    tags:["quick","high-protein"], cuisine:"japanese" },

  { id:"l_jp3", name:"Tonkotsu Ramen", mealType:"lunch", image:IMG.noodles,
    calories:580, protein:28, carbs:62, fat:22, prepTime:15,
    ingredients:["1 pack ramen noodles","2 cups tonkotsu broth (packet or homemade)","chashu pork (or soft-boiled egg)","bamboo shoots","nori","corn","green onion","butter"],
    instructions:["Heat broth.","Cook noodles.","Assemble: noodles in broth, top with all toppings.","Add butter on top."],
    tags:["quick"], cuisine:"japanese" },

  { id:"l_jp4", name:"Salmon Onigiri Set", mealType:"lunch", image:IMG.japanese,
    calories:480, protein:22, carbs:70, fat:10, prepTime:15,
    ingredients:["2 cups cooked sushi rice","canned or grilled salmon","soy sauce","nori sheets","miso soup on side","edamame"],
    instructions:["Season rice with salt.","Mix salmon with a little mayo and soy.","Wet hands, shape rice into triangles with salmon inside.","Wrap with nori. Serve with miso soup."],
    tags:["quick","high-protein"], cuisine:"japanese" },

  { id:"d_jp1", name:"Teriyaki Salmon & Rice", mealType:"dinner", image:IMG.fish,
    calories:540, protein:36, carbs:56, fat:16, prepTime:20,
    ingredients:["2 salmon fillets","1.5 cups rice","soy sauce","mirin","sake (or water)","sugar","sesame seeds","steamed vegetables"],
    instructions:["Pan-fry salmon 3 min per side.","Add teriyaki sauce (soy, mirin, sugar), glaze.","Serve over rice with vegetables and sesame."],
    tags:["gluten-free","high-protein","quick"], cuisine:"japanese" },

  { id:"d_jp2", name:"Gyoza & Rice", mealType:"dinner", image:IMG.japanese,
    calories:520, protein:22, carbs:68, fat:18, prepTime:25,
    ingredients:["12 gyoza (store-bought or homemade)","1.5 cups rice","oil","ponzu or soy-vinegar dipping sauce","miso soup"],
    instructions:["Pan-fry gyoza flat-side down 3 min.","Add water, cover and steam 4 min.","Uncover and crisp up 1 min.","Serve with rice, dipping sauce and miso soup."],
    tags:["quick"], cuisine:"japanese" },

  { id:"d_jp3", name:"Chicken Karaage & Rice", mealType:"dinner", image:IMG.chicken,
    calories:600, protein:36, carbs:62, fat:22, prepTime:30,
    ingredients:["400g chicken thighs","1.5 cups rice","soy sauce","ginger","garlic","sake","potato starch or cornstarch","oil for frying","lemon","mayo"],
    instructions:["Marinate chicken in soy, ginger, garlic and sake 15 min.","Coat in potato starch.","Deep fry until golden and crispy.","Serve over rice with lemon and mayo."],
    tags:["high-protein"], cuisine:"japanese" },

  { id:"s_jp1", name:"Edamame", mealType:"snack", image:IMG.snack,
    calories:160, protein:13, carbs:14, fat:6, prepTime:5,
    ingredients:["200g edamame (frozen, in pods)","sea salt"],
    instructions:["Boil edamame 4 min.","Drain and toss with sea salt.","Pop beans from pods and eat."],
    tags:["vegan","gluten-free","high-protein","quick"], cuisine:"japanese" },

  // ═══════════════════════════════════════════════════
  // CHINESE
  // ═══════════════════════════════════════════════════

  { id:"b_cn1", name:"Rice Congee (Jook)", mealType:"breakfast", image:IMG.chinese,
    calories:310, protein:12, carbs:52, fat:6, prepTime:30,
    ingredients:["½ cup rice","4 cups chicken stock or water","ginger slices","100g chicken (shredded) or egg","green onion","sesame oil","soy sauce","fried shallots"],
    instructions:["Simmer rice in stock with ginger 25 min until porridge-like.","Add chicken or poached egg.","Top with green onion, soy and sesame oil."],
    tags:["gluten-free","quick"], cuisine:"chinese" },

  { id:"b_cn2", name:"Fried Egg & Soy Sauce Rice", mealType:"breakfast", image:IMG.chinese,
    calories:380, protein:14, carbs:58, fat:12, prepTime:10,
    ingredients:["1.5 cups leftover rice","2 eggs","soy sauce","sesame oil","green onion","oil"],
    instructions:["Fry eggs in oil — crispy edges.","Serve over rice.","Drizzle soy sauce and sesame oil.","Top with green onion."],
    tags:["gluten-free","quick"], cuisine:"chinese" },

  { id:"l_cn1", name:"Tomato & Egg Stir Fry with Rice", mealType:"lunch", image:IMG.chinese,
    calories:460, protein:16, carbs:68, fat:14, prepTime:15,
    ingredients:["3 eggs","2 large tomatoes","1.5 cups rice","garlic","sugar","soy sauce","sesame oil","green onion","oil"],
    instructions:["Scramble eggs lightly, set aside.","Stir fry garlic and tomatoes until saucy.","Add back eggs, season with soy and sugar.","Serve over rice."],
    tags:["vegetarian","quick","gluten-free"], cuisine:"chinese" },

  { id:"l_cn2", name:"Mapo Tofu & Rice", mealType:"lunch", image:IMG.chinese,
    calories:490, protein:22, carbs:62, fat:16, prepTime:20,
    ingredients:["400g soft tofu","150g pork mince (optional)","1.5 cups rice","doubanjiang (chilli bean paste)","garlic","ginger","Sichuan pepper","soy sauce","cornstarch","green onion"],
    instructions:["Fry pork with garlic, ginger and doubanjiang.","Add stock and tofu cubes, simmer 5 min.","Thicken with cornstarch.","Serve over rice with Sichuan pepper and green onion."],
    tags:["gluten-free"], cuisine:"chinese" },

  { id:"l_cn3", name:"Simple Fried Rice", mealType:"lunch", image:IMG.chinese,
    calories:480, protein:14, carbs:72, fat:16, prepTime:15,
    ingredients:["2 cups day-old cooked rice","2 eggs","peas and carrots","soy sauce","garlic","sesame oil","green onion","oil"],
    instructions:["Stir fry garlic in hot wok.","Push to side, scramble eggs.","Add rice, break up and fry hot 3 min.","Add peas, soy sauce, sesame oil and green onion."],
    tags:["vegetarian","quick","gluten-free"], cuisine:"chinese" },

  { id:"l_cn4", name:"Wonton Noodle Soup", mealType:"lunch", image:IMG.noodles,
    calories:460, protein:22, carbs:58, fat:12, prepTime:20,
    ingredients:["10 wonton dumplings (frozen)","egg noodles","chicken broth","soy sauce","sesame oil","bok choy","green onion","ginger"],
    instructions:["Simmer broth with ginger and soy.","Cook wontons and noodles separately.","Blanch bok choy in broth.","Assemble: noodles, wontons, bok choy in broth.","Drizzle sesame oil and top with green onion."],
    tags:["quick"], cuisine:"chinese" },

  { id:"d_cn1", name:"Steamed Fish & Rice", mealType:"dinner", image:IMG.fish,
    calories:440, protein:36, carbs:54, fat:10, prepTime:20,
    ingredients:["2 fish fillets (sea bass or tilapia)","1.5 cups rice","ginger (sliced)","spring onion","soy sauce","sesame oil","cooking oil (hot pour)","coriander"],
    instructions:["Steam fish with ginger 8–10 min.","Top with julienned ginger and spring onion.","Pour hot oil over fish (it sizzles!).","Drizzle soy sauce. Serve with rice."],
    tags:["gluten-free","high-protein"], cuisine:"chinese" },

  { id:"d_cn2", name:"Beef & Broccoli Rice", mealType:"dinner", image:IMG.chinese,
    calories:540, protein:34, carbs:64, fat:16, prepTime:25,
    ingredients:["300g beef (sliced thin)","1 head broccoli","1.5 cups rice","oyster sauce","soy sauce","garlic","ginger","cornstarch","sesame oil"],
    instructions:["Marinate beef in soy and cornstarch.","Stir fry garlic and ginger, add beef.","Add broccoli and sauce (oyster + soy + water).","Cook 3 min. Serve over rice."],
    tags:["high-protein"], cuisine:"chinese" },

  { id:"d_cn3", name:"Pork Fried Rice", mealType:"dinner", image:IMG.chinese,
    calories:560, protein:24, carbs:70, fat:18, prepTime:20,
    ingredients:["2 cups cooked rice","200g char siu pork or pork mince","2 eggs","peas","carrots","garlic","soy sauce","sesame oil","green onion","oil"],
    instructions:["Stir fry garlic and pork.","Push to side, scramble eggs.","Add rice, fry on high heat.","Add vegetables, soy and sesame.","Finish with green onion."],
    tags:["quick","gluten-free"], cuisine:"chinese" },

  { id:"s_cn1", name:"Sunflower Seeds & Fruit", mealType:"snack", image:IMG.snack,
    calories:180, protein:5, carbs:26, fat:8, prepTime:2,
    ingredients:["1 orange or apple","small handful sunflower seeds"],
    instructions:["Peel and eat fruit with seeds as a simple snack."],
    tags:["vegan","gluten-free","quick"], cuisine:"chinese" },

  // ═══════════════════════════════════════════════════
  // KOREAN
  // ═══════════════════════════════════════════════════

  { id:"b_kr1", name:"Kimchi Fried Rice & Egg", mealType:"breakfast", image:IMG.korean,
    calories:420, protein:16, carbs:62, fat:14, prepTime:12,
    ingredients:["1.5 cups cooked rice","½ cup kimchi (chopped)","2 eggs","1 sheet nori","sesame oil","soy sauce","green onion","gochujang (optional)"],
    instructions:["Stir fry kimchi in sesame oil 2 min.","Add rice, mix well.","Fry eggs separately — runny yolk.","Serve rice in bowl, top with egg and nori strips."],
    tags:["gluten-free","quick"], cuisine:"korean" },

  { id:"b_kr2", name:"Toast & Fried Egg", mealType:"breakfast", image:IMG.breakfast,
    calories:360, protein:14, carbs:38, fat:16, prepTime:8,
    ingredients:["2 slices white bread","2 eggs","butter","ketchup or mayo","salt & pepper"],
    instructions:["Toast bread and butter it.","Fry eggs in butter.","Serve on toast with ketchup."],
    tags:["quick"], cuisine:"korean" },

  { id:"l_kr1", name:"Bibimbap", mealType:"lunch", image:IMG.korean,
    calories:540, protein:22, carbs:76, fat:16, prepTime:30,
    ingredients:["1.5 cups cooked rice","fried egg","spinach","bean sprouts","carrots (julienned)","courgette","beef mince or tofu","gochujang sauce","sesame oil","soy sauce"],
    instructions:["Prepare each vegetable: blanch, sauté or raw.","Brown beef or tofu with soy sauce.","Arrange everything over rice in bowl.","Top with egg, gochujang and sesame oil.","Mix thoroughly before eating."],
    tags:["gluten-free","high-protein"], cuisine:"korean" },

  { id:"l_kr2", name:"Sundubu Jjigae (Soft Tofu Stew)", mealType:"lunch", image:IMG.soup,
    calories:380, protein:20, carbs:22, fat:18, prepTime:20,
    ingredients:["1 pack soft tofu","100g pork or beef mince","1 egg","kimchi","anchovy stock","gochugaru (chilli flakes)","garlic","sesame oil","green onion","cooked rice (side)"],
    instructions:["Fry pork with garlic and chilli in sesame oil.","Add kimchi and stock, bring to boil.","Add soft tofu in large spoonfuls.","Crack in egg at the end.","Serve bubbling hot with rice."],
    tags:["gluten-free","high-protein"], cuisine:"korean" },

  { id:"l_kr3", name:"Kimbap", mealType:"lunch", image:IMG.korean,
    calories:480, protein:16, carbs:72, fat:12, prepTime:25,
    ingredients:["2 cups cooked sushi rice","4 nori sheets","carrot","spinach","pickled radish (danmuji)","canned tuna or ham","sesame oil","salt"],
    instructions:["Season rice with sesame oil and salt.","Prepare fillings.","Layer rice on nori, add fillings in a line.","Roll tightly, seal with water.","Slice into rounds."],
    tags:["quick"], cuisine:"korean" },

  { id:"d_kr1", name:"Doenjang Jjigae & Rice", mealType:"dinner", image:IMG.korean,
    calories:440, protein:22, carbs:58, fat:14, prepTime:20,
    ingredients:["3 tbsp doenjang (soybean paste)","200g tofu","1 courgette","mushrooms","1 potato","½ onion","anchovy stock","garlic","gochugaru","green onion","cooked rice"],
    instructions:["Bring anchovy stock to boil.","Add doenjang and dissolve.","Add all vegetables and tofu, simmer 15 min.","Serve with plain rice."],
    tags:["vegetarian","gluten-free"], cuisine:"korean" },

  { id:"d_kr2", name:"Samgyeopsal (Grilled Pork Belly)", mealType:"dinner", image:IMG.chicken,
    calories:620, protein:32, carbs:28, fat:42, prepTime:20,
    ingredients:["400g pork belly slices","lettuce leaves","garlic cloves","green chilli","ssamjang sauce","sesame oil","salt","cooked rice"],
    instructions:["Grill pork belly on hot pan until crispy.","Grill garlic and chilli alongside.","Wrap pork in lettuce with rice, garlic and ssamjang.","Eat as a wrap."],
    tags:["gluten-free","high-protein"], cuisine:"korean" },

  { id:"d_kr3", name:"Bulgogi Rice Bowl", mealType:"dinner", image:IMG.korean,
    calories:580, protein:36, carbs:66, fat:16, prepTime:25,
    ingredients:["400g beef (thin sliced)","1.5 cups rice","soy sauce","sugar","sesame oil","garlic","ginger","pear or apple (grated, for marinade)","green onion","sesame seeds"],
    instructions:["Marinate beef in soy, sugar, sesame oil, garlic and pear.","Stir fry on high heat until caramelised.","Serve over rice with green onion and sesame seeds."],
    tags:["gluten-free","high-protein"], cuisine:"korean" },

  { id:"s_kr1", name:"Tteokbokki (Rice Cakes)", mealType:"snack", image:IMG.snack,
    calories:280, protein:6, carbs:54, fat:4, prepTime:15,
    ingredients:["200g tteok (rice cakes)","gochujang sauce","fish cake","anchovy stock","sugar","green onion"],
    instructions:["Simmer stock with gochujang and sugar.","Add rice cakes and fish cake.","Cook 10 min until sauce thickens.","Serve topped with green onion."],
    tags:["vegetarian","quick"], cuisine:"korean" },

  // ═══════════════════════════════════════════════════
  // THAI
  // ═══════════════════════════════════════════════════

  { id:"b_th1", name:"Thai Congee (Jok)", mealType:"breakfast", image:IMG.rice,
    calories:340, protein:14, carbs:54, fat:8, prepTime:25,
    ingredients:["½ cup rice","4 cups pork or chicken stock","100g pork mince or egg","ginger","fish sauce","white pepper","green onion","coriander","fried garlic"],
    instructions:["Simmer rice in stock with ginger 20 min until thick.","Add pork mince or poached egg.","Season with fish sauce and pepper.","Top with green onion, coriander and fried garlic."],
    tags:["gluten-free","quick"], cuisine:"thai" },

  { id:"b_th2", name:"Khai Jiao (Thai Omelette) & Rice", mealType:"breakfast", image:IMG.omelette,
    calories:420, protein:18, carbs:54, fat:16, prepTime:10,
    ingredients:["3 eggs","fish sauce","1.5 cups rice","oil for frying","sweet chilli sauce","cucumber slices"],
    instructions:["Beat eggs with fish sauce.","Fry in HOT oil — edges get crispy and puffy.","Serve immediately over rice with sweet chilli sauce and cucumber."],
    tags:["gluten-free","quick","high-protein"], cuisine:"thai" },

  { id:"l_th1", name:"Pad Thai", mealType:"lunch", image:IMG.noodles,
    calories:560, protein:22, carbs:72, fat:18, prepTime:20,
    ingredients:["200g rice noodles","2 eggs","100g shrimp or chicken or tofu","bean sprouts","green onion","pad thai sauce (tamarind, fish sauce, sugar)","peanuts","lime"],
    instructions:["Soak noodles.","Stir fry protein, push aside and scramble eggs.","Add noodles and sauce, toss on high heat.","Add bean sprouts last.","Serve with peanuts, lime and chilli flakes."],
    tags:["gluten-free","quick"], cuisine:"thai" },

  { id:"l_th2", name:"Khao Man Gai (Chicken Rice)", mealType:"lunch", image:IMG.rice,
    calories:540, protein:36, carbs:62, fat:14, prepTime:30,
    ingredients:["2 chicken thighs or breast","1.5 cups jasmine rice","garlic","ginger","chicken stock","cucumber","coriander","ginger-garlic dipping sauce (soy, ginger, garlic, vinegar)"],
    instructions:["Poach chicken in stock with garlic and ginger 20 min.","Cook rice in the poaching stock.","Slice chicken over rice.","Serve with cucumber, coriander and dipping sauce."],
    tags:["gluten-free","high-protein"], cuisine:"thai" },

  { id:"l_th3", name:"Tom Yum Noodle Soup", mealType:"lunch", image:IMG.soup,
    calories:380, protein:22, carbs:46, fat:10, prepTime:20,
    ingredients:["rice noodles","6 tiger prawns or chicken","tom yum paste","coconut milk (splash)","mushrooms","lemongrass","kaffir lime leaves","fish sauce","lime juice","coriander"],
    instructions:["Simmer stock with tom yum paste, lemongrass and kaffir lime leaves.","Add mushrooms and protein.","Add splash of coconut milk.","Cook noodles separately.","Assemble in bowl with lime and coriander."],
    tags:["gluten-free","high-protein","quick"], cuisine:"thai" },

  { id:"d_th1", name:"Thai Basil Chicken Rice (Pad Krapow)", mealType:"dinner", image:IMG.rice,
    calories:560, protein:34, carbs:62, fat:18, prepTime:15,
    ingredients:["400g chicken mince","1.5 cups jasmine rice","holy basil or regular basil","oyster sauce","fish sauce","soy sauce","garlic","red chilli","fried egg per person"],
    instructions:["Fry garlic and chilli in very hot pan.","Add chicken mince, break up and fry.","Add oyster sauce, fish sauce and soy.","Stir in basil at the end.","Serve over rice with fried egg on top."],
    tags:["gluten-free","high-protein","quick"], cuisine:"thai" },

  { id:"d_th2", name:"Green Curry & Rice", mealType:"dinner", image:IMG.curry,
    calories:600, protein:30, carbs:62, fat:26, prepTime:25,
    ingredients:["400g chicken or tofu","1.5 cups rice","2 tbsp green curry paste","1 can coconut milk","Thai aubergine or courgette","fish sauce","palm sugar","kaffir lime leaves","Thai basil"],
    instructions:["Fry green curry paste in oil 1 min.","Add coconut milk, bring to simmer.","Add chicken, vegetables, fish sauce and sugar.","Cook 15 min.","Serve over jasmine rice with basil."],
    tags:["gluten-free"], cuisine:"thai" },

  { id:"d_th3", name:"Thai Fried Rice", mealType:"dinner", image:IMG.rice,
    calories:520, protein:22, carbs:72, fat:16, prepTime:15,
    ingredients:["2 cups day-old jasmine rice","2 eggs","150g chicken or shrimp","garlic","fish sauce","oyster sauce","spring onion","lime","cucumber","tomato"],
    instructions:["Stir fry garlic, add protein.","Push aside, scramble eggs.","Add rice and fry on high heat.","Season with fish sauce and oyster sauce.","Serve with lime, cucumber and tomato."],
    tags:["gluten-free","quick"], cuisine:"thai" },

  { id:"s_th1", name:"Fresh Tropical Fruit", mealType:"snack", image:IMG.snack,
    calories:140, protein:2, carbs:34, fat:0, prepTime:3,
    ingredients:["1 mango or papaya or pineapple","optional: chilli flakes and salt"],
    instructions:["Peel and slice fruit.","Eat as-is or with a pinch of chilli and salt (Thai street style)."],
    tags:["vegan","gluten-free","quick"], cuisine:"thai" },

  // ═══════════════════════════════════════════════════
  // MEDITERRANEAN / GREEK
  // ═══════════════════════════════════════════════════

  { id:"b_gr1", name:"Greek Yogurt with Honey & Walnuts", mealType:"breakfast", image:IMG.snack,
    calories:340, protein:16, carbs:38, fat:14, prepTime:3,
    ingredients:["1 cup thick Greek yogurt","2 tbsp honey","handful walnuts or almonds","optional: fresh berries"],
    instructions:["Spoon yogurt into bowl.","Drizzle honey and scatter nuts.","Add fruit if using."],
    tags:["vegetarian","gluten-free","high-protein","quick"], cuisine:"greek" },

  { id:"b_gr2", name:"Toast with Olive Oil & Tomato", mealType:"breakfast", image:IMG.bread,
    calories:320, protein:8, carbs:44, fat:14, prepTime:5,
    ingredients:["2 slices crusty bread","2 tbsp olive oil","1 tomato (rubbed or sliced)","salt","oregano","optional: feta"],
    instructions:["Toast or grill bread.","Rub with cut tomato or lay slices on top.","Drizzle olive oil, season with salt and oregano.","Crumble feta if using."],
    tags:["vegan","quick"], cuisine:"greek" },

  { id:"l_gr1", name:"Greek Salad & Pita", mealType:"lunch", image:IMG.salad,
    calories:420, protein:12, carbs:44, fat:22, prepTime:10,
    ingredients:["tomatoes","cucumber","green pepper","red onion","Kalamata olives","feta block","olive oil","dried oregano","red wine vinegar","2 warm pita breads"],
    instructions:["Chop vegetables and place in bowl.","Add olives and whole feta block on top.","Dress with olive oil, vinegar and oregano.","Serve with warm pita."],
    tags:["vegetarian","gluten-free"], cuisine:"greek" },

  { id:"l_gr2", name:"Hummus & Pita Bread", mealType:"lunch", image:IMG.bread,
    calories:440, protein:14, carbs:60, fat:16, prepTime:5,
    ingredients:["1 can chickpeas","2 tbsp tahini","lemon juice","garlic","olive oil","paprika","3 pita breads"],
    instructions:["Blend chickpeas, tahini, lemon and garlic until smooth.","Drizzle olive oil and paprika on top.","Warm pita and serve alongside."],
    tags:["vegan","high-fibre","quick"], cuisine:"greek" },

  { id:"d_gr1", name:"Moussaka", mealType:"dinner", image:IMG.comfort,
    calories:620, protein:30, carbs:42, fat:34, prepTime:70,
    ingredients:["2 aubergines","400g beef or lamb mince","1 can tomatoes","onion","garlic","cinnamon","béchamel sauce","parmesan","olive oil"],
    instructions:["Slice and salt aubergine, roast until soft.","Brown mince with onion, garlic, tomatoes and cinnamon.","Layer aubergine, meat sauce, béchamel.","Bake 180°C 40 min until golden."],
    tags:["high-protein"], cuisine:"greek" },

  { id:"d_gr2", name:"Chicken Souvlaki & Chips", mealType:"dinner", image:IMG.chicken,
    calories:600, protein:42, carbs:52, fat:22, prepTime:30,
    ingredients:["400g chicken breast (cubed)","lemon juice","olive oil","garlic","oregano","tzatziki","pita or chips","tomato","onion"],
    instructions:["Marinate chicken in lemon, oil, garlic and oregano.","Thread onto skewers, grill 10–12 min.","Serve with pita or chips, tzatziki and salad."],
    tags:["gluten-free","high-protein"], cuisine:"greek" },

  { id:"s_gr1", name:"Olives & Feta", mealType:"snack", image:IMG.snack,
    calories:200, protein:6, carbs:4, fat:18, prepTime:2,
    ingredients:["handful Kalamata olives","50g feta cheese","drizzle olive oil","pinch oregano"],
    instructions:["Arrange olives and feta on a small plate.","Drizzle oil and sprinkle oregano."],
    tags:["vegetarian","gluten-free","quick"], cuisine:"greek" },

  // ═══════════════════════════════════════════════════
  // AFRICAN (West African everyday)
  // ═══════════════════════════════════════════════════

  { id:"b_af1", name:"Fried Egg & Bread with Tea", mealType:"breakfast", image:IMG.egg,
    calories:380, protein:16, carbs:36, fat:18, prepTime:10,
    ingredients:["2 eggs","2 slices white bread","butter or oil","cup of tea","salt & pepper"],
    instructions:["Fry eggs in butter or oil.","Toast bread.","Serve together with hot tea."],
    tags:["quick"], cuisine:"african" },

  { id:"b_af2", name:"Ogi (Pap) & Akara", mealType:"breakfast", image:IMG.african,
    calories:380, protein:14, carbs:60, fat:10, prepTime:20,
    ingredients:["1 cup ogi (cornmeal porridge) or pap","sugar or milk","3 akara (bean fritters)"],
    instructions:["Cook ogi with water until thick, sweeten.","Fry akara until golden.","Serve pap alongside akara."],
    tags:["vegan","gluten-free","high-fibre"], cuisine:"african" },

  { id:"b_af3", name:"Fried Plantain & Eggs", mealType:"breakfast", image:IMG.omelette,
    calories:420, protein:12, carbs:58, fat:16, prepTime:15,
    ingredients:["1 ripe plantain","2 eggs","oil for frying","salt","optional: beans"],
    instructions:["Slice plantain into rounds, fry until golden.","Fry or scramble eggs.","Serve together with tea."],
    tags:["gluten-free","quick"], cuisine:"african" },

  { id:"l_af1", name:"Jollof Rice & Chicken", mealType:"lunch", image:IMG.african,
    calories:640, protein:36, carbs:78, fat:18, prepTime:50,
    ingredients:["1.5 cups long grain rice","4 chicken pieces","1 can tomatoes","1 onion","red bell pepper","scotch bonnet","tomato paste","chicken stock","thyme","bay leaf","oil"],
    instructions:["Blend tomatoes, pepper and scotch bonnet.","Fry onion, add tomato paste and blended pepper.","Stir in rice and stock, cook 25 min.","Grill or fry chicken separately with spices.","Serve jollof rice with chicken."],
    tags:["gluten-free","high-protein"], cuisine:"african" },

  { id:"l_af2", name:"White Rice & Chicken Stew", mealType:"lunch", image:IMG.rice,
    calories:600, protein:34, carbs:74, fat:18, prepTime:40,
    ingredients:["1.5 cups rice","3 chicken pieces","1 can tomatoes","onion","scotch bonnet","tomato paste","curry powder","thyme","oil","salt"],
    instructions:["Fry onion, add tomato paste, blended tomato and seasoning.","Add chicken and simmer 25 min.","Cook plain rice.","Serve rice with stew."],
    tags:["gluten-free","high-protein"], cuisine:"african" },

  { id:"l_af3", name:"Rice & Beans (Waakye)", mealType:"lunch", image:IMG.rice,
    calories:520, protein:18, carbs:88, fat:8, prepTime:40,
    ingredients:["1 cup rice","½ cup black-eyed peas or cowpeas","dried millet leaves (optional)","salt","fried plantain (side)","shito or pepper sauce","egg (boiled)"],
    instructions:["Cook beans until half done.","Add rice and continue cooking together.","Millet leaves give the dish its colour.","Serve with fried plantain, boiled egg and pepper sauce."],
    tags:["vegan","gluten-free","high-fibre"], cuisine:"african" },

  { id:"d_af1", name:"Egusi Soup & Rice", mealType:"dinner", image:IMG.african,
    calories:620, protein:28, carbs:68, fat:28, prepTime:50,
    ingredients:["1 cup ground egusi (melon seeds)","assorted meat (chicken, beef)","spinach or bitter leaf","palm oil","onion","crayfish","stock cubes","scotch bonnet","1.5 cups rice"],
    instructions:["Heat palm oil, fry egusi paste until cooked.","Add blended tomato, onion and crayfish.","Add stock and meat, simmer 20 min.","Stir in greens and cook 5 min.","Serve over rice."],
    tags:["gluten-free","high-protein"], cuisine:"african" },

  { id:"d_af2", name:"Fried Rice & Chicken", mealType:"dinner", image:IMG.rice,
    calories:600, protein:34, carbs:72, fat:20, prepTime:35,
    ingredients:["1.5 cups cooked rice","3 chicken pieces (fried or grilled)","mixed vegetables (carrots, peas, peppers)","eggs","soy sauce","curry powder","oil","spring onion"],
    instructions:["Fry vegetables in oil.","Push aside and scramble eggs.","Add rice, fry on high heat.","Add soy sauce and curry powder.","Serve with grilled or fried chicken."],
    tags:["gluten-free","high-protein"], cuisine:"african" },

  { id:"s_af1", name:"Roasted Groundnuts (Peanuts)", mealType:"snack", image:IMG.snack,
    calories:200, protein:9, carbs:8, fat:16, prepTime:2,
    ingredients:["handful roasted peanuts","pinch salt"],
    instructions:["Pour roasted peanuts into a cone of paper or small bowl.","Eat with cold drink or tea."],
    tags:["vegan","gluten-free","quick"], cuisine:"african" },

  { id:"s_af2", name:"Puff Puff", mealType:"snack", image:IMG.snack,
    calories:220, protein:4, carbs:30, fat:10, prepTime:30,
    ingredients:["1 cup flour","yeast","sugar","nutmeg","water","oil for deep frying"],
    instructions:["Mix flour, yeast, sugar and nutmeg with warm water to soft dough.","Rest 30 min until risen.","Drop spoonfuls into hot oil.","Fry until round and golden."],
    tags:["vegan","quick"], cuisine:"african" },

  // ═══════════════════════════════════════════════════
  // SPANISH
  // ═══════════════════════════════════════════════════

  { id:"b_sp1", name:"Pan con Tomate", mealType:"breakfast", image:IMG.bread,
    calories:320, protein:7, carbs:46, fat:12, prepTime:5,
    ingredients:["2 slices crusty bread (or toasted baguette)","1 ripe tomato","olive oil","garlic clove","salt"],
    instructions:["Toast bread.","Rub with garlic, then tomato half.","Drizzle olive oil and season with salt."],
    tags:["vegan","quick"], cuisine:"spanish" },

  { id:"b_sp2", name:"Spanish Omelette (Tortilla)", mealType:"breakfast", image:IMG.omelette,
    calories:420, protein:16, carbs:32, fat:24, prepTime:25,
    ingredients:["4 eggs","2 potatoes (sliced thin)","1 onion","olive oil","salt"],
    instructions:["Slow cook potato and onion in oil 15 min until soft.","Beat eggs, add potato mix.","Cook in oiled pan 5 min, flip, cook 3 more min.","Serve warm or cold, cut in wedges."],
    tags:["vegetarian","gluten-free"], cuisine:"spanish" },

  { id:"l_sp1", name:"Bocadillo de Jamón", mealType:"lunch", image:IMG.sandwich,
    calories:480, protein:22, carbs:50, fat:20, prepTime:5,
    ingredients:["½ baguette","4 slices jamón serrano or ibérico","olive oil","tomato (optional)","manchego cheese (optional)"],
    instructions:["Slice baguette lengthwise.","Drizzle oil inside.","Layer ham and cheese.","Rub with tomato if using."],
    tags:["quick","high-protein"], cuisine:"spanish" },

  { id:"d_sp1", name:"Paella", mealType:"dinner", image:IMG.rice,
    calories:600, protein:30, carbs:76, fat:16, prepTime:45,
    ingredients:["1.5 cups bomba or arborio rice","300g mixed seafood or chicken","1 onion","2 garlic cloves","saffron","smoked paprika","1 can tomatoes","chicken stock","olive oil","lemon","parsley"],
    instructions:["Fry onion and garlic.","Add paprika, tomato and rice, toast 2 min.","Add hot saffron stock, do NOT stir.","Add seafood or chicken on top.","Cook 18–20 min until socarrat forms on bottom.","Serve with lemon."],
    tags:["gluten-free"], cuisine:"spanish" },

  { id:"d_sp2", name:"Chicken & Rice Spanish Style", mealType:"dinner", image:IMG.chicken,
    calories:580, protein:38, carbs:58, fat:20, prepTime:40,
    ingredients:["4 chicken thighs","1.5 cups rice","onion","garlic","red pepper","smoked paprika","white wine (optional)","chicken stock","olive oil","parsley","lemon"],
    instructions:["Brown chicken in olive oil.","Fry onion, garlic and pepper.","Add rice, paprika and wine.","Add hot stock, nestle chicken in.","Cook 25 min covered."],
    tags:["gluten-free","high-protein"], cuisine:"spanish" },

  { id:"s_sp1", name:"Patatas Bravas", mealType:"snack", image:IMG.snack,
    calories:260, protein:5, carbs:38, fat:10, prepTime:30,
    ingredients:["3 potatoes (cubed)","smoked paprika","garlic","olive oil","salt","aioli or tomato brava sauce"],
    instructions:["Roast potato cubes in olive oil at 210°C 25 min until crispy.","Toss with smoked paprika and salt.","Serve with aioli or brava sauce."],
    tags:["vegan","gluten-free"], cuisine:"spanish" },

];

export const getRecipesByType = (type: Recipe["mealType"]) =>
  RECIPES.filter((r) => r.mealType === type);

export const filterRecipes = (
  recipes: Recipe[],
  tags: string[],
  allergies: string[]
): Recipe[] => {
  if (tags.length === 0 && allergies.length === 0) return recipes;
  return recipes.filter((r) => {
    const hasTag = tags.length === 0 || tags.some((t) => r.tags.includes(t));
    const noAllergy = allergies.length === 0 || !allergies.some((a) => {
      const lower = a.toLowerCase();
      return (
        r.ingredients.some((i) => i.toLowerCase().includes(lower)) ||
        r.name.toLowerCase().includes(lower)
      );
    });
    return hasTag && noAllergy;
  });
};
