# Exercise icon progress

Goal: every exercise in `src/data/popularExercises.ts` resolves to a bundled Bold Pose icon.
10 pilot icons already existed; 163 were missing. Each missing exercise gets one icon
component (`src/components/exercise-icons/icons/<Component>.vue`) + one manifest entry
(alias = exact catalog name), then `pnpm generate:exercise-icons` rewrites `generated/*`.

Status legend: [ ] pending · [x] icon component created + manifest entry added


## chest

- [x] Chest Fly — key `dumbbell-chest-fly`, component `DumbbellChestFlyIcon`, pose `supine-fly`
- [x] Cable Crossover — key `cable-crossover`, component `CableCrossoverIcon`, pose `standing-fly`
- [x] Cable Fly — key `cable-fly`, component `CableFlyIcon`, pose `standing-fly`
- [x] Chest Press Machine — key `machine-chest-press`, component `MachineChestPressIcon`, pose `seated-press`
- [x] Incline Chest Press Machine — key `machine-incline-chest-press`, component `MachineInclineChestPressIcon`, pose `seated-press`
- [x] Pec Deck — key `machine-pec-deck`, component `MachinePecDeckIcon`, pose `seated-fly`
- [ ] Smith Machine Bench Press — key `smith-machine-bench-press`, component `SmithMachineBenchPressIcon`, pose `horizontal-press`
- [ ] Smith Machine Incline Press — key `smith-machine-incline-press`, component `SmithMachineInclinePressIcon`, pose `incline-press`
- [ ] Beast Push-up — key `bodyweight-beast-push-up`, component `BodyweightBeastPushUpIcon`, pose `quadruped`
- [ ] Clap Push-ups — key `bodyweight-clap-push-up`, component `BodyweightClapPushUpIcon`, pose `prone-press`
- [ ] Decline Push-ups — key `bodyweight-decline-push-up`, component `BodyweightDeclinePushUpIcon`, pose `prone-press`
- [ ] Diamond Push-ups — key `bodyweight-diamond-push-up`, component `BodyweightDiamondPushUpIcon`, pose `prone-press`
- [ ] Dips — key `bodyweight-dips`, component `BodyweightDipsIcon`, pose `support-press`
- [ ] Push-ups — key `bodyweight-push-up`, component `BodyweightPushUpIcon`, pose `prone-press`
- [ ] Wide Push-ups — key `bodyweight-wide-push-up`, component `BodyweightWidePushUpIcon`, pose `prone-press`

## back

- [ ] Kettlebell Dead Clean — key `kettlebell-dead-clean`, component `KettlebellDeadCleanIcon`, pose `hinge`
- [ ] Kettlebell Gorilla Row — key `kettlebell-gorilla-row`, component `KettlebellGorillaRowIcon`, pose `hinged-pull`
- [ ] Kettlebell Row — key `kettlebell-row`, component `KettlebellRowIcon`, pose `hinged-pull`
- [ ] Kettlebell Single Arm Swing — key `kettlebell-single-arm-swing`, component `KettlebellSingleArmSwingIcon`, pose `ballistic-hinge`
- [ ] Lat Pulldown — key `cable-lat-pulldown`, component `CableLatPulldownIcon`, pose `seated-pulldown`
- [ ] Straight Arm Pulldown — key `cable-straight-arm-pulldown`, component `CableStraightArmPulldownIcon`, pose `standing-pulldown`
- [ ] Assisted Pull-up Machine — key `machine-assisted-pull-up`, component `MachineAssistedPullUpIcon`, pose `hang-pull`
- [ ] Back Extension Machine — key `machine-back-extension`, component `MachineBackExtensionIcon`, pose `hinge`
- [ ] Chest Supported Row — key `machine-chest-supported-row`, component `MachineChestSupportedRowIcon`, pose `supported-pull`
- [ ] Reverse Hyper Machine — key `machine-reverse-hyper`, component `MachineReverseHyperIcon`, pose `prone-hinge`
- [ ] Seated Row Machine — key `machine-seated-row`, component `MachineSeatedRowIcon`, pose `seated-pull`
- [ ] T-Bar Row Machine — key `machine-t-bar-row`, component `MachineTBarRowIcon`, pose `hinged-pull`
- [ ] Chin-ups — key `bodyweight-chin-up`, component `BodyweightChinUpIcon`, pose `hang-pull`
- [ ] Dead Hang — key `bodyweight-dead-hang`, component `BodyweightDeadHangIcon`, pose `hang`
- [ ] Inverted Rows — key `bodyweight-inverted-row`, component `BodyweightInvertedRowIcon`, pose `supine-pull`
- [ ] Prone Y-Raises — key `bodyweight-prone-y-raise`, component `BodyweightProneYRaiseIcon`, pose `prone-raise`
- [ ] Pull-ups — key `bodyweight-pull-up`, component `BodyweightPullUpIcon`, pose `hang-pull`
- [ ] Club Pullover — key `club-pullover`, component `ClubPulloverIcon`, pose `overhead-arc`

## shoulders

- [ ] Lateral Raise — key `dumbbell-lateral-raise`, component `DumbbellLateralRaiseIcon`, pose `standing-raise`
- [ ] Kettlebell Armbar — key `kettlebell-armbar`, component `KettlebellArmbarIcon`, pose `supine-hold`
- [ ] Kettlebell Clean — key `kettlebell-clean`, component `KettlebellCleanIcon`, pose `rack-catch`
- [ ] Kettlebell Clean and Press — key `kettlebell-clean-and-press`, component `KettlebellCleanAndPressIcon`, pose `vertical-press`
- [ ] Kettlebell Halo — key `kettlebell-halo`, component `KettlebellHaloIcon`, pose `head-circle`
- [ ] Kettlebell High Pull — key `kettlebell-high-pull`, component `KettlebellHighPullIcon`, pose `upright-pull`
- [ ] Kettlebell Press — key `kettlebell-press`, component `KettlebellPressIcon`, pose `vertical-press`
- [ ] Kettlebell Snatch — key `kettlebell-snatch`, component `KettlebellSnatchIcon`, pose `overhead-lockout`
- [ ] Cable Face Pull — key `cable-face-pull`, component `CableFacePullIcon`, pose `standing-pull`
- [ ] Cable Reverse Fly — key `cable-reverse-fly`, component `CableReverseFlyIcon`, pose `standing-fly`
- [ ] Lateral Raise Machine — key `machine-lateral-raise`, component `MachineLateralRaiseIcon`, pose `seated-raise`
- [ ] Rear Delt Machine — key `machine-rear-delt`, component `MachineRearDeltIcon`, pose `seated-fly`
- [ ] Shoulder Press Machine — key `machine-shoulder-press`, component `MachineShoulderPressIcon`, pose `seated-press`
- [ ] Smith Machine Shoulder Press — key `smith-machine-shoulder-press`, component `SmithMachineShoulderPressIcon`, pose `seated-press`
- [ ] Handstand Push-ups — key `bodyweight-handstand-push-up`, component `BodyweightHandstandPushUpIcon`, pose `inverted-press`
- [ ] Pike Hold — key `bodyweight-pike-hold`, component `BodyweightPikeHoldIcon`, pose `pike`
- [ ] Pike Push-ups — key `bodyweight-pike-push-up`, component `BodyweightPikePushUpIcon`, pose `pike`
- [ ] Shoulder Taps — key `bodyweight-shoulder-taps`, component `BodyweightShoulderTapsIcon`, pose `prone-brace`

## clubs

- [x] Club Gama Cast — key `club-gama-cast`, component `ClubGamaCastIcon`, pose `club-swing`
- [x] Club Inside Circle — key `club-inside-circle`, component `ClubInsideCircleIcon`, pose `club-circle`
- [x] Club Mill — key `club-mill`, component `ClubMillIcon`, pose `club-mill`
- [x] Club Outside Circle — key `club-outside-circle`, component `ClubOutsideCircleIcon`, pose `club-circle`
- [x] Club Reverse Mill — key `club-reverse-mill`, component `ClubReverseMillIcon`, pose `club-mill`
- [x] Club Shield Cast — key `club-shield-cast`, component `ClubShieldCastIcon`, pose `club-swing`
- [x] Club Swipe — key `club-swipe`, component `ClubSwipeIcon`, pose `club-swing`
- [x] Battle Rope Waves — key `battle-rope-waves`, component `BattleRopeWavesIcon`, pose `rope-slam`

## arms

- [x] Cable Bicep Curl — key `cable-bicep-curl`, component `CableBicepCurlIcon`, pose `standing-curl`
- [x] Cable Hammer Curl — key `cable-hammer-curl`, component `CableHammerCurlIcon`, pose `standing-curl`
- [x] Tricep Extension — key `cable-tricep-extension`, component `CableTricepExtensionIcon`, pose `standing-pushdown`
- [x] Bicep Curl Machine — key `machine-bicep-curl`, component `MachineBicepCurlIcon`, pose `seated-curl`
- [x] Preacher Curl Machine — key `machine-preacher-curl`, component `MachinePreacherCurlIcon`, pose `seated-curl`
- [x] Tricep Dip Machine — key `machine-tricep-dip`, component `MachineTricepDipIcon`, pose `seated-press`
- [x] Tricep Extension Machine — key `machine-tricep-extension`, component `MachineTricepExtensionIcon`, pose `seated-extension`
- [x] Bench Dips — key `bodyweight-bench-dips`, component `BodyweightBenchDipsIcon`, pose `support-press`

## legs-free

- [ ] Barbell Calf Raises — key `barbell-calf-raise`, component `BarbellCalfRaiseIcon`, pose `standing-raise`
- [ ] Barbell Good Mornings — key `barbell-good-morning`, component `BarbellGoodMorningIcon`, pose `hinge`
- [ ] Barbell Hip Thrust — key `barbell-hip-thrust`, component `BarbellHipThrustIcon`, pose `supine-bridge`
- [ ] Barbell Lunges — key `barbell-lunge`, component `BarbellLungeIcon`, pose `lunge`
- [ ] Barbell Romanian Deadlift — key `barbell-romanian-deadlift`, component `BarbellRomanianDeadliftIcon`, pose `hinge`
- [ ] Front Squat — key `barbell-front-squat`, component `BarbellFrontSquatIcon`, pose `squat`
- [ ] Sumo Deadlift — key `barbell-sumo-deadlift`, component `BarbellSumoDeadliftIcon`, pose `hinge`
- [ ] Dumbbell Bulgarian Split Squat — key `dumbbell-bulgarian-split-squat`, component `DumbbellBulgarianSplitSquatIcon`, pose `split-squat`
- [ ] Dumbbell Calf Raises — key `dumbbell-calf-raise`, component `DumbbellCalfRaiseIcon`, pose `standing-raise`
- [ ] Dumbbell Goblet Squat — key `dumbbell-goblet-squat`, component `DumbbellGobletSquatIcon`, pose `goblet-squat`
- [ ] Dumbbell Hip Thrust — key `dumbbell-hip-thrust`, component `DumbbellHipThrustIcon`, pose `supine-bridge`
- [ ] Dumbbell Lunges — key `dumbbell-lunge`, component `DumbbellLungeIcon`, pose `lunge`
- [ ] Dumbbell Romanian Deadlift — key `dumbbell-romanian-deadlift`, component `DumbbellRomanianDeadliftIcon`, pose `hinge`
- [ ] Dumbbell Single Leg Deadlift — key `dumbbell-single-leg-deadlift`, component `DumbbellSingleLegDeadliftIcon`, pose `single-leg-hinge`
- [ ] Dumbbell Step-ups — key `dumbbell-step-up`, component `DumbbellStepUpIcon`, pose `step-up`
- [ ] Dumbbell Sumo Squat — key `dumbbell-sumo-squat`, component `DumbbellSumoSquatIcon`, pose `squat`
- [ ] Kettlebell Single Leg Deadlift — key `kettlebell-single-leg-deadlift`, component `KettlebellSingleLegDeadliftIcon`, pose `single-leg-hinge`
- [ ] Kettlebell Thruster — key `kettlebell-thruster`, component `KettlebellThrusterIcon`, pose `squat-press`
- [ ] Cable Kickbacks — key `cable-kickback`, component `CableKickbackIcon`, pose `standing-kickback`
- [ ] Cable Pull-Through — key `cable-pull-through`, component `CablePullThroughIcon`, pose `hinge`
- [ ] Cable Romanian Deadlift — key `cable-romanian-deadlift`, component `CableRomanianDeadliftIcon`, pose `hinge`

## legs-machine

- [ ] Belt Squat Machine — key `machine-belt-squat`, component `MachineBeltSquatIcon`, pose `squat`
- [ ] Donkey Calf Raise Machine — key `machine-donkey-calf-raise`, component `MachineDonkeyCalfRaiseIcon`, pose `hinged-raise`
- [ ] Glute Drive Machine — key `machine-glute-drive`, component `MachineGluteDriveIcon`, pose `supine-bridge`
- [ ] Glute Kickback Machine — key `machine-glute-kickback`, component `MachineGluteKickbackIcon`, pose `standing-kickback`
- [ ] Hack Squat Machine — key `machine-hack-squat`, component `MachineHackSquatIcon`, pose `sled-squat`
- [ ] Hip Abduction Machine — key `machine-hip-abduction`, component `MachineHipAbductionIcon`, pose `seated-legs-open`
- [ ] Hip Adduction Machine — key `machine-hip-adduction`, component `MachineHipAdductionIcon`, pose `seated-legs-closed`
- [ ] Hip Thrust Machine — key `machine-hip-thrust`, component `MachineHipThrustIcon`, pose `supine-bridge`
- [ ] Leg Curl — key `machine-leg-curl`, component `MachineLegCurlIcon`, pose `seated-curl-leg`
- [ ] Leg Extension — key `machine-leg-extension`, component `MachineLegExtensionIcon`, pose `seated-extension-leg`
- [ ] Leg Press — key `machine-leg-press`, component `MachineLegPressIcon`, pose `seated-leg-press`
- [ ] Leg Press Calf Raise — key `machine-leg-press-calf-raise`, component `MachineLegPressCalfRaiseIcon`, pose `seated-leg-press`
- [ ] Lying Leg Curl — key `machine-lying-leg-curl`, component `MachineLyingLegCurlIcon`, pose `prone-curl-leg`
- [ ] Nordic Curl Machine — key `machine-nordic-curl`, component `MachineNordicCurlIcon`, pose `kneeling-lower`
- [ ] Pendulum Squat — key `machine-pendulum-squat`, component `MachinePendulumSquatIcon`, pose `sled-squat`
- [ ] Reverse Hack Squat — key `machine-reverse-hack-squat`, component `MachineReverseHackSquatIcon`, pose `sled-squat`
- [ ] Seated Calf Raise — key `machine-seated-calf-raise`, component `MachineSeatedCalfRaiseIcon`, pose `seated-raise`
- [ ] Seated Leg Curl — key `machine-seated-leg-curl`, component `MachineSeatedLegCurlIcon`, pose `seated-curl-leg`
- [ ] Sissy Squat Machine — key `machine-sissy-squat`, component `MachineSissySquatIcon`, pose `lean-back-squat`
- [ ] Smith Machine Lunges — key `smith-machine-lunge`, component `SmithMachineLungeIcon`, pose `lunge`
- [ ] Smith Machine Romanian Deadlift — key `smith-machine-romanian-deadlift`, component `SmithMachineRomanianDeadliftIcon`, pose `hinge`
- [ ] Smith Machine Squat — key `smith-machine-squat`, component `SmithMachineSquatIcon`, pose `squat`
- [ ] Standing Calf Raise Machine — key `machine-standing-calf-raise`, component `MachineStandingCalfRaiseIcon`, pose `standing-raise`
- [ ] Standing Leg Curl — key `machine-standing-leg-curl`, component `MachineStandingLegCurlIcon`, pose `standing-curl-leg`
- [ ] V-Squat Machine — key `machine-v-squat`, component `MachineVSquatIcon`, pose `sled-squat`
- [ ] Vertical Leg Press — key `machine-vertical-leg-press`, component `MachineVerticalLegPressIcon`, pose `supine-leg-press`

## legs-bodyweight

- [ ] Bodyweight Squat — key `bodyweight-squat`, component `BodyweightSquatIcon`, pose `squat`
- [ ] Bulgarian Split Squat — key `bodyweight-bulgarian-split-squat`, component `BodyweightBulgarianSplitSquatIcon`, pose `split-squat`
- [ ] Burpees — key `bodyweight-burpee`, component `BodyweightBurpeeIcon`, pose `jump`
- [ ] Butt Kicks — key `bodyweight-butt-kicks`, component `BodyweightButtKicksIcon`, pose `run`
- [ ] Calf Raises — key `bodyweight-calf-raise`, component `BodyweightCalfRaiseIcon`, pose `standing-raise`
- [ ] Donkey Kicks — key `bodyweight-donkey-kick`, component `BodyweightDonkeyKickIcon`, pose `quadruped-kick`
- [ ] Glute Bridge Hold — key `bodyweight-glute-bridge-hold`, component `BodyweightGluteBridgeHoldIcon`, pose `supine-bridge`
- [ ] Glute Bridges — key `bodyweight-glute-bridge`, component `BodyweightGluteBridgeIcon`, pose `supine-bridge`
- [ ] High Knees — key `bodyweight-high-knees`, component `BodyweightHighKneesIcon`, pose `run`
- [ ] Jump Lunges — key `bodyweight-jump-lunge`, component `BodyweightJumpLungeIcon`, pose `jump-lunge`
- [ ] Jump Rope — key `bodyweight-jump-rope`, component `BodyweightJumpRopeIcon`, pose `jump-rope`
- [ ] Jump Squats — key `bodyweight-jump-squat`, component `BodyweightJumpSquatIcon`, pose `jump`
- [ ] Jumping Jacks — key `bodyweight-jumping-jacks`, component `BodyweightJumpingJacksIcon`, pose `star-jump`
- [ ] Lunges — key `bodyweight-lunge`, component `BodyweightLungeIcon`, pose `lunge`
- [ ] Pistol Squats — key `bodyweight-pistol-squat`, component `BodyweightPistolSquatIcon`, pose `single-leg-squat`
- [ ] Reverse Lunges — key `bodyweight-reverse-lunge`, component `BodyweightReverseLungeIcon`, pose `lunge`
- [ ] Single Leg Glute Bridge — key `bodyweight-single-leg-glute-bridge`, component `BodyweightSingleLegGluteBridgeIcon`, pose `supine-bridge`
- [ ] Sprawls — key `bodyweight-sprawl`, component `BodyweightSprawlIcon`, pose `prone-thrust`
- [ ] Squat Thrusts — key `bodyweight-squat-thrust`, component `BodyweightSquatThrustIcon`, pose `prone-thrust`
- [ ] Step-ups — key `bodyweight-step-up`, component `BodyweightStepUpIcon`, pose `step-up`
- [ ] Tuck Jumps — key `bodyweight-tuck-jump`, component `BodyweightTuckJumpIcon`, pose `jump`
- [ ] Walking Lunges — key `bodyweight-walking-lunge`, component `BodyweightWalkingLungeIcon`, pose `lunge`
- [ ] Wall Sit — key `bodyweight-wall-sit`, component `BodyweightWallSitIcon`, pose `wall-sit`

## core

- [ ] Kettlebell Figure 8 — key `kettlebell-figure-8`, component `KettlebellFigure8Icon`, pose `rotation`
- [ ] Kettlebell Windmill — key `kettlebell-windmill`, component `KettlebellWindmillIcon`, pose `windmill`
- [ ] Weighted Plank — key `dumbbell-weighted-plank`, component `DumbbellWeightedPlankIcon`, pose `prone-brace`
- [ ] Cable Crunch — key `cable-crunch`, component `CableCrunchIcon`, pose `kneeling-crunch`
- [ ] Cable Woodchop — key `cable-woodchop`, component `CableWoodchopIcon`, pose `rotation`
- [ ] Bear Crawl — key `bodyweight-bear-crawl`, component `BodyweightBearCrawlIcon`, pose `quadruped`
- [ ] Bicycle Crunches — key `bodyweight-bicycle-crunch`, component `BodyweightBicycleCrunchIcon`, pose `supine-crunch`
- [ ] Bird Dog — key `bodyweight-bird-dog`, component `BodyweightBirdDogIcon`, pose `quadruped-reach`
- [ ] Bodyweight Get-up — key `bodyweight-get-up`, component `BodyweightGetUpIcon`, pose `ground-to-standing`
- [ ] Crunches — key `bodyweight-crunch`, component `BodyweightCrunchIcon`, pose `supine-crunch`
- [ ] Dead Bug — key `bodyweight-dead-bug`, component `BodyweightDeadBugIcon`, pose `supine-reach`
- [ ] Flutter Kicks — key `bodyweight-flutter-kicks`, component `BodyweightFlutterKicksIcon`, pose `supine-kick`
- [ ] Hollow Body Hold — key `bodyweight-hollow-body-hold`, component `BodyweightHollowBodyHoldIcon`, pose `supine-hollow`
- [ ] Inchworms — key `bodyweight-inchworm`, component `BodyweightInchwormIcon`, pose `pike-walk`
- [ ] L-Sit — key `bodyweight-l-sit`, component `BodyweightLSitIcon`, pose `support-hold`
- [ ] Leg Raises — key `bodyweight-leg-raise`, component `BodyweightLegRaiseIcon`, pose `supine-kick`
- [ ] Mountain Climbers — key `bodyweight-mountain-climber`, component `BodyweightMountainClimberIcon`, pose `prone-drive`
- [ ] Plank to Pike — key `bodyweight-plank-to-pike`, component `BodyweightPlankToPikeIcon`, pose `pike`
- [ ] Reverse Crunches — key `bodyweight-reverse-crunch`, component `BodyweightReverseCrunchIcon`, pose `supine-crunch`
- [ ] Russian Twists — key `bodyweight-russian-twist`, component `BodyweightRussianTwistIcon`, pose `seated-twist`
- [ ] Side Plank — key `bodyweight-side-plank`, component `BodyweightSidePlankIcon`, pose `side-brace`
- [ ] Sit-ups — key `bodyweight-sit-up`, component `BodyweightSitUpIcon`, pose `supine-crunch`
- [ ] Superman — key `bodyweight-superman`, component `BodyweightSupermanIcon`, pose `prone-raise`
- [ ] Toe Touches — key `bodyweight-toe-touch`, component `BodyweightToeTouchIcon`, pose `supine-reach`
- [ ] V-ups — key `bodyweight-v-up`, component `BodyweightVUpIcon`, pose `supine-fold`
- [ ] Club Pendulum — key `club-pendulum`, component `ClubPendulumIcon`, pose `club-swing`

## Wrap-up checklist

- [ ] manifest.ts entries for all 163 (aliases unique, exact catalog names)
- [ ] pnpm generate:exercise-icons (rewrites generated/iconKeys|iconAliases|iconRegistry)
- [ ] update src/__tests__/components/exercise-icons/ExerciseIcon.spec.ts (10 -> 173, pilot-names test, add all-popular-exercises-resolve test)
- [ ] update manifest.ts header comment (no longer pilot-only)
- [ ] pnpm type-check && pnpm lint && pnpm test
- [ ] commit + push claude/missing-icon-exercises-xjss75
