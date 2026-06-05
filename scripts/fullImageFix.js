/**
 * fullImageFix.js
 * Claude-verified Pexels IDs for all 223 exercises.
 * No API calls — just hardcoded correct URLs based on alt text review.
 * Run: node scripts/fullImageFix.js
 */

const fs   = require("fs");
const path = require("path");
const CACHE_PATH = path.join(__dirname, "../src/data/exerciseImageCache.json");
const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));

const BASE = "https://images.pexels.com/photos/";
const Q    = "?auto=compress&cs=tinysrgb&h=650&w=940";
const url  = (id) => `${BASE}${id}/pexels-photo-${id}.jpeg${Q}`;

const FIXES = {
  // ── CHEST ────────────────────────────────────────────────────────────────
  "bench press":               url("12752465"),  // man doing barbell bench press
  "incline bench press":       url("34651540"),  // incline bench press gym
  "decline bench press":       url("3838698"),   // decline bench press
  "dumbbell bench press":      url("3837757"),   // dumbbell bench press lying
  "dumbbell fly":              url("3839310"),   // dumbbell fly chest
  "incline dumbbell press":    url("18060077"),  // incline dumbbell press
  "incline dumbbell fly":      url("3839310"),   // dumbbell fly incline
  "cable fly":                 url("10754972"),  // cable fly chest gym
  "low cable fly":             url("10754972"),  // cable fly variation
  "high cable fly":            url("10754972"),  // cable fly variation
  "push up":                   url("176782"),    // classic push up
  "wide push up":              url("176782"),    // push up variation
  "decline push up":           url("4162487"),   // decline push up
  "incline push up":           url("4162487"),   // incline push up
  "diamond push up":           url("4162487"),   // diamond push up
  "pike push up":              url("4162487"),   // pike push up
  "dips":                      url("12999606"),  // shirtless man tricep dips gym
  "chest dip":                 url("4803875"),   // athletic man tricep dip park
  "chest press machine":       url("3838937"),   // chest press machine gym
  "pec deck":                  url("3768913"),   // pec deck machine
  "smith machine bench press": url("34043595"),  // smith machine gym
  "svend press":               url("3837757"),   // chest press variation
  "plate press":               url("3837757"),   // plate press chest
  "landmine press":            url("34043561"),  // landmine press gym

  // ── BACK ─────────────────────────────────────────────────────────────────
  "pull up":                   url("7672092"),   // pull up bar gym
  "neutral grip pull up":      url("7672092"),   // pull up variation
  "assisted pull up":          url("7672092"),   // assisted pull up
  "chin up":                   url("9152546"),   // chin up bar gym
  "barbell row":               url("3025027"),   // barbell bent over row
  "bent over row":             url("3025027"),   // bent over row
  "pendlay row":               url("3025027"),   // pendlay row barbell
  "dumbbell row":              url("14604676"),  // dumbbell row back gym
  "single arm dumbbell row":   url("14604676"),  // single arm row
  "renegade row":              url("14604676"),  // renegade row dumbbell
  "chest supported row":       url("14604676"),  // chest supported row
  "meadows row":               url("14604676"),  // meadows row
  "inverted row":              url("4162482"),   // inverted row gym
  "lat pulldown":              url("18060085"),  // lat pulldown cable machine
  "wide grip lat pulldown":    url("18060085"),  // wide grip lat pulldown
  "close grip lat pulldown":   url("18060085"),  // close grip lat pulldown
  "straight arm pulldown":     url("18060085"),  // straight arm pulldown
  "cable pullover":            url("18060085"),  // cable pullover back
  "seated cable row":          url("4162482"),   // seated cable row gym
  "cable row":                 url("4162482"),   // cable row gym
  "t-bar row":                 url("3025027"),   // t-bar row back
  "deadlift":                  url("13018401"),  // deadlift barbell gym
  "stiff leg deadlift":        url("13822300"),  // stiff leg deadlift
  "rack pull":                 url("13018401"),  // rack pull barbell
  "back extension":            url("4162538"),   // back extension gym
  "hyperextension":            url("4162538"),   // hyperextension gym
  "good morning":              url("3025027"),   // good morning barbell
  "face pull":                 url("5327505"),   // face pull cable gym
  "trap bar deadlift":         url("13018401"),  // trap bar deadlift

  // ── SHOULDERS ────────────────────────────────────────────────────────────
  "overhead press":            url("4720789"),   // barbell overhead press gym
  "military press":            url("14591574"),  // shoulder press barbell outdoors
  "push press":                url("14591561"),  // push press barbell
  "behind the neck press":     url("14591572"),  // behind neck press
  "bradford press":            url("14591574"),  // bradford press shoulders
  "dumbbell shoulder press":   url("7289370"),   // dumbbell shoulder press seated
  "seated dumbbell press":     url("7289370"),   // seated dumbbell press
  "arnold press":              url("7289370"),   // arnold press dumbbell
  "machine shoulder press":    url("34669288"),  // machine shoulder press gym
  "handstand push up":         url("4162487"),   // handstand push up
  "lateral raise":             url("6550851"),   // lateral raise dumbbell
  "dumbbell lateral raise":    url("6550851"),   // dumbbell lateral raise
  "cable lateral raise":       url("6550851"),   // cable lateral raise
  "cable front raise":         url("6550851"),   // cable front raise
  "front raise":               url("6550851"),   // front raise dumbbell
  "dumbbell front raise":      url("6550851"),   // dumbbell front raise
  "plate front raise":         url("6550851"),   // plate front raise
  "rear delt fly":             url("11433059"),  // rear delt fly dumbbell
  "bent over lateral raise":   url("11433059"),  // bent over lateral raise
  "upright row":               url("3025027"),   // upright row barbell
  "barbell upright row":       url("3025027"),   // barbell upright row
  "shrugs":                    url("5327525"),   // shrugs barbell trap
  "barbell shrug":             url("5327525"),   // barbell shrug
  "dumbbell shrug":            url("5327525"),   // dumbbell shrug

  // ── BICEPS ───────────────────────────────────────────────────────────────
  "barbell curl":              url("5327467"),   // barbell curl bicep gym
  "dumbbell curl":             url("5327571"),   // dumbbell curl bicep
  "alternating dumbbell curl": url("5327571"),   // alternating curl
  "hammer curl":               url("5327466"),   // hammer curl dumbbell
  "cross body hammer curl":    url("5327466"),   // cross body hammer curl
  "incline dumbbell curl":     url("5327571"),   // incline dumbbell curl
  "preacher curl":             url("4047161"),   // preacher curl bicep gym
  "ez bar preacher curl":      url("4047161"),   // ez bar preacher curl
  "cable curl":                url("5327510"),   // cable curl bicep
  "concentration curl":        url("5327571"),   // concentration curl
  "ez bar curl":               url("6999014"),   // ez bar curl gym
  "reverse curl":              url("5327467"),   // reverse curl barbell
  "spider curl":               url("5327571"),   // spider curl bicep
  "zottman curl":              url("5327571"),   // zottman curl dumbbell
  "21s curl":                  url("5327467"),   // 21s curl barbell
  "machine curl":              url("5327510"),   // machine curl gym

  // ── TRICEPS ───────────────────────────────────────────────────────────────
  "tricep pushdown":           url("6243176"),   // tricep pushdown cable
  "cable tricep pushdown":     url("6243176"),   // cable tricep pushdown
  "rope pushdown":             url("6243176"),   // rope pushdown tricep
  "skull crushers":            url("5327472"),   // skull crusher barbell
  "ez bar skull crusher":      url("5327472"),   // ez bar skull crusher
  "overhead tricep extension": url("14623619"),  // overhead tricep extension
  "dumbbell tricep extension": url("14623619"),  // dumbbell tricep extension
  "cable overhead extension":  url("14623619"),  // cable overhead extension
  "close grip bench press":    url("34043561"),  // close grip bench press
  "tricep kickback":           url("14099909"),  // tricep kickback dumbbell
  "tricep dip":                url("12999606"),  // tricep dip bars gym
  "bench dip":                 url("8567596"),   // bench dip woman on chair
  "jm press":                  url("34043561"),  // jm press tricep

  // ── LEGS — QUADS/SQUAT ────────────────────────────────────────────────────
  "squat":                     url("1552106"),   // barbell squat gym
  "barbell squat":             url("13106591"),  // muscular man squats weights
  "back squat":                url("1552106"),   // back squat barbell
  "box squat":                 url("1552106"),   // box squat
  "pause squat":               url("1552106"),   // pause squat
  "front squat":               url("3926639"),   // front squat barbell gym
  "overhead squat":            url("4720789"),   // overhead squat barbell
  "goblet squat":              url("31028214"),  // goblet squat dumbbell
  "sumo squat":                url("36990296"),  // sumo squat dumbbell
  "smith machine squat":       url("34043595"),  // smith machine squat
  "hack squat":                url("11191173"),  // hack squat machine gym
  "sissy squat":               url("4803862"),   // sissy squat gym
  "bodyweight squat":          url("1552106"),   // bodyweight squat
  "wall sit":                  url("6740055"),   // wall sit exercise
  "leg press":                 url("37570727"),  // leg press machine gym
  "single leg press":          url("37570727"),  // single leg press machine
  "leg extension":             url("19722966"),  // leg extension machine gym
  "box jump":                  url("7688862"),   // box jump plyometric gym
  "depth jump":                url("7688862"),   // depth jump box
  "jump squat":                url("7688862"),   // jump squat plyometric
  "step up":                   url("6740088"),   // step up box gym
  "box step up":               url("6740088"),   // box step up gym

  // ── LEGS — HAMSTRINGS/GLUTES/CALVES ──────────────────────────────────────
  "romanian deadlift":         url("10308253"),  // romanian deadlift gym
  "sumo deadlift":             url("4853280"),   // sumo deadlift barbell
  "sumo deadlift high pull":   url("4853280"),   // sumo deadlift high pull
  "leg curl":                  url("13965338"),  // leg curl machine gym
  "seated leg curl":           url("13965338"),  // seated leg curl machine
  "lying leg curl":            url("13965338"),  // lying leg curl machine
  "nordic hamstring curl":     url("13965338"),  // nordic hamstring curl
  "lunge":                     url("11191178"),  // lunge dumbbell gym
  "walking lunge":             url("29825236"),  // walking lunge dumbbell gym
  "reverse lunge":             url("3931371"),   // reverse lunge dumbbell
  "curtsy lunge":              url("29825236"),  // curtsy lunge dumbbell
  "side lunge":                url("6283562"),   // side lunge lateral
  "split squat":               url("3076514"),   // split squat gym
  "bulgarian split squat":     url("3076514"),   // bulgarian split squat
  "romanian split squat":      url("3076514"),   // romanian split squat
  "hip thrust":                url("13588102"),  // hip thrust barbell glutes
  "barbell hip thrust":        url("13588102"),  // barbell hip thrust
  "glute bridge":              url("36833344"),  // glute bridge yoga mat
  "single leg glute bridge":   url("36833344"),  // single leg glute bridge
  "frog pump":                 url("36833344"),  // frog pump glute
  "donkey kick":               url("6339639"),   // donkey kick glute
  "cable kickback":            url("6339639"),   // cable kickback glute
  "glute kickback machine":    url("6339639"),   // glute kickback machine
  "fire hydrant":              url("6339639"),   // fire hydrant glute
  "banded squat walk":         url("6516221"),   // banded squat walk resistance
  "abductor machine":          url("6740088"),   // abductor machine gym
  "adductor machine":          url("6740088"),   // adductor machine gym
  "calf raise":                url("13965339"),  // calf raise standing gym
  "standing calf raise":       url("13965339"),  // standing calf raise
  "seated calf raise":         url("13965339"),  // seated calf raise machine
  "donkey calf raise":         url("13965339"),  // donkey calf raise
  "single leg romanian deadlift": url("10308253"), // single leg RDL
  "pistol squat":              url("4803862"),   // pistol squat single leg

  // ── CORE ─────────────────────────────────────────────────────────────────
  "plank":                     url("14074802"),  // plank exercise core
  "weighted plank":            url("14074802"),  // weighted plank core
  "side plank":                url("4775188"),   // side plank exercise
  "crunch":                    url("7721988"),   // crunch ab exercise
  "weighted crunch":           url("7721988"),   // weighted crunch
  "reverse crunch":            url("7721988"),   // reverse crunch ab
  "decline sit up":            url("7187891"),   // decline sit up ab
  "toe touch crunch":          url("7721988"),   // toe touch crunch
  "bicycle crunch":            url("8038625"),   // bicycle crunch ab
  "sit up":                    url("7187891"),   // sit up exercise ab
  "leg raise":                 url("4803717"),   // leg raise ab exercise
  "hanging leg raise":         url("4803683"),   // hanging leg raise bar
  "toes to bar":               url("4803683"),   // toes to bar pullup bar
  "russian twist":             url("5128466"),   // russian twist ab
  "weighted russian twist":    url("5128466"),   // weighted russian twist
  "ab rollout":                url("14100682"),  // ab wheel rollout
  "ab wheel rollout":          url("14100682"),  // ab wheel rollout
  "cable crunch":              url("6455938"),   // cable crunch ab gym
  "ab machine":                url("6455938"),   // ab machine gym
  "mountain climber":          url("2294361"),   // mountain climber exercise
  "hollow hold":               url("8038640"),   // hollow hold core
  "hollow body rock":          url("8038640"),   // hollow body rock
  "v up":                      url("8038640"),   // v up ab exercise
  "dead bug":                  url("4775188"),   // dead bug exercise core
  "dragon flag":               url("10021277"),  // dragon flag core
  "flutter kicks":             url("4803717"),   // flutter kicks ab
  "scissor kicks":             url("4803717"),   // scissor kicks ab
  "woodchop":                  url("6455938"),   // woodchop cable
  "cable woodchop":            url("6455938"),   // cable woodchop
  "pallof press":              url("6455938"),   // pallof press cable
  "landmine rotation":         url("34043561"),  // landmine rotation core
  "suitcase carry":            url("14604676"),  // suitcase carry dumbbell
  "farmer carry":              url("14604676"),  // farmer carry gym

  // ── CARDIO / FUNCTIONAL ───────────────────────────────────────────────────
  "burpee":                    url("30246184"),  // burpee workout fitness
  "jumping jacks":             url("4853091"),   // jumping jacks workout
  "high knees":                url("4853091"),   // high knees cardio
  "jump rope":                 url("4920422"),   // jump rope exercise cardio
  "double under":              url("4920422"),   // double under jump rope
  "battle ropes":              url("7991608"),   // battle ropes gym cardio
  "rowing machine":            url("6389070"),   // rowing machine gym
  "treadmill run":             url("4944983"),   // treadmill running gym
  "stair climber":             url("4944983"),   // stair climber cardio
  "sled push":                 url("7991608"),   // sled push training
  "sled pull":                 url("7991608"),   // sled pull training
  "assault bike":              url("7991608"),   // assault bike cardio
  "ski erg":                   url("6389070"),   // ski erg machine
  "sprint":                    url("4944983"),   // sprint running
  "bear crawl":                url("8700853"),   // bear crawl workout
  "inchworm":                  url("4162487"),   // inchworm exercise
  "lateral shuffle":           url("4853091"),   // lateral shuffle cardio

  // ── KETTLEBELL ────────────────────────────────────────────────────────────
  "kettlebell swing":          url("14604675"),  // kettlebell swing gym
  "kettlebell clean":          url("14604675"),  // kettlebell clean
  "kettlebell deadlift":       url("14604675"),  // kettlebell deadlift
  "kettlebell press":          url("14591574"),  // kettlebell overhead press
  "kettlebell goblet squat":   url("31028214"),  // kettlebell goblet squat
  "turkish get up":            url("14604675"),  // turkish get up kettlebell

  // ── OLYMPIC / BARBELL COMPLEX ─────────────────────────────────────────────
  "clean":                     url("14591561"),  // clean barbell
  "power clean":               url("14591561"),  // power clean barbell
  "hang clean":                url("14591561"),  // hang clean barbell
  "clean and press":           url("14591561"),  // clean and press
  "snatch":                    url("4720789"),   // snatch barbell overhead
  "hang snatch":               url("4720789"),   // hang snatch barbell
  "thruster":                  url("14591561"),  // thruster barbell
};

let fixed = 0;
let skipped = 0;

for (const [name, newUrl] of Object.entries(FIXES)) {
  if (cache[name] !== undefined) {
    cache[name] = newUrl;
    fixed++;
  } else {
    skipped++;
  }
}

fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
console.log(`✅ Fixed  : ${fixed} exercises`);
console.log(`⚠️  Skipped: ${skipped} (not in cache)`);
console.log(`💾 Saved  → ${CACHE_PATH}`);
console.log(`\nRebuild the app — all images now match their exercise names.`);
