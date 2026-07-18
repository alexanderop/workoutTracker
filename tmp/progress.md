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
- [x] Smith Machine Bench Press — key `smith-machine-bench-press`, component `SmithMachineBenchPressIcon`, pose `horizontal-press`
- [x] Smith Machine Incline Press — key `smith-machine-incline-press`, component `SmithMachineInclinePressIcon`, pose `incline-press`
- [x] Beast Push-up — key `bodyweight-beast-push-up`, component `BodyweightBeastPushUpIcon`, pose `quadruped`
- [x] Clap Push-ups — key `bodyweight-clap-push-up`, component `BodyweightClapPushUpIcon`, pose `prone-press`
- [x] Decline Push-ups — key `bodyweight-decline-push-up`, component `BodyweightDeclinePushUpIcon`, pose `prone-press`
- [x] Diamond Push-ups — key `bodyweight-diamond-push-up`, component `BodyweightDiamondPushUpIcon`, pose `prone-press`
- [x] Dips — key `bodyweight-dips`, component `BodyweightDipsIcon`, pose `support-press`
- [x] Push-ups — key `bodyweight-push-up`, component `BodyweightPushUpIcon`, pose `prone-press`
- [x] Wide Push-ups — key `bodyweight-wide-push-up`, component `BodyweightWidePushUpIcon`, pose `prone-press`

## back

- [x] Kettlebell Dead Clean — key `kettlebell-dead-clean`, component `KettlebellDeadCleanIcon`, pose `hinge`
- [x] Kettlebell Gorilla Row — key `kettlebell-gorilla-row`, component `KettlebellGorillaRowIcon`, pose `hinged-pull`
- [x] Kettlebell Row — key `kettlebell-row`, component `KettlebellRowIcon`, pose `hinged-pull`
- [x] Kettlebell Single Arm Swing — key `kettlebell-single-arm-swing`, component `KettlebellSingleArmSwingIcon`, pose `ballistic-hinge`
- [x] Lat Pulldown — key `cable-lat-pulldown`, component `CableLatPulldownIcon`, pose `seated-pulldown`
- [x] Straight Arm Pulldown — key `cable-straight-arm-pulldown`, component `CableStraightArmPulldownIcon`, pose `standing-pulldown`
- [x] Assisted Pull-up Machine — key `machine-assisted-pull-up`, component `MachineAssistedPullUpIcon`, pose `hang-pull`
- [x] Back Extension Machine — key `machine-back-extension`, component `MachineBackExtensionIcon`, pose `hinge`
- [x] Chest Supported Row — key `machine-chest-supported-row`, component `MachineChestSupportedRowIcon`, pose `supported-pull`
- [x] Reverse Hyper Machine — key `machine-reverse-hyper`, component `MachineReverseHyperIcon`, pose `prone-hinge`
- [x] Seated Row Machine — key `machine-seated-row`, component `MachineSeatedRowIcon`, pose `seated-pull`
- [x] T-Bar Row Machine — key `machine-t-bar-row`, component `MachineTBarRowIcon`, pose `hinged-pull`
- [x] Chin-ups — key `bodyweight-chin-up`, component `BodyweightChinUpIcon`, pose `hang-pull`
- [x] Dead Hang — key `bodyweight-dead-hang`, component `BodyweightDeadHangIcon`, pose `hang`
- [x] Inverted Rows — key `bodyweight-inverted-row`, component `BodyweightInvertedRowIcon`, pose `supine-pull`
- [x] Prone Y-Raises — key `bodyweight-prone-y-raise`, component `BodyweightProneYRaiseIcon`, pose `prone-raise`
- [x] Pull-ups — key `bodyweight-pull-up`, component `BodyweightPullUpIcon`, pose `hang-pull`
- [x] Club Pullover — key `club-pullover`, component `ClubPulloverIcon`, pose `overhead-arc`

## shoulders

- [x] Lateral Raise — key `dumbbell-lateral-raise`, component `DumbbellLateralRaiseIcon`, pose `standing-raise`
- [x] Kettlebell Armbar — key `kettlebell-armbar`, component `KettlebellArmbarIcon`, pose `supine-hold`
- [x] Kettlebell Clean — key `kettlebell-clean`, component `KettlebellCleanIcon`, pose `rack-catch`
- [x] Kettlebell Clean and Press — key `kettlebell-clean-and-press`, component `KettlebellCleanAndPressIcon`, pose `vertical-press`
- [x] Kettlebell Halo — key `kettlebell-halo`, component `KettlebellHaloIcon`, pose `head-circle`
- [x] Kettlebell High Pull — key `kettlebell-high-pull`, component `KettlebellHighPullIcon`, pose `upright-pull`
- [x] Kettlebell Press — key `kettlebell-press`, component `KettlebellPressIcon`, pose `vertical-press`
- [x] Kettlebell Snatch — key `kettlebell-snatch`, component `KettlebellSnatchIcon`, pose `overhead-lockout`
- [x] Cable Face Pull — key `cable-face-pull`, component `CableFacePullIcon`, pose `standing-pull`
- [x] Cable Reverse Fly — key `cable-reverse-fly`, component `CableReverseFlyIcon`, pose `standing-fly`
- [x] Lateral Raise Machine — key `machine-lateral-raise`, component `MachineLateralRaiseIcon`, pose `seated-raise`
- [x] Rear Delt Machine — key `machine-rear-delt`, component `MachineRearDeltIcon`, pose `seated-fly`
- [x] Shoulder Press Machine — key `machine-shoulder-press`, component `MachineShoulderPressIcon`, pose `seated-press`
- [x] Smith Machine Shoulder Press — key `smith-machine-shoulder-press`, component `SmithMachineShoulderPressIcon`, pose `seated-press`
- [x] Handstand Push-ups — key `bodyweight-handstand-push-up`, component `BodyweightHandstandPushUpIcon`, pose `inverted-press`
- [x] Pike Hold — key `bodyweight-pike-hold`, component `BodyweightPikeHoldIcon`, pose `pike`
- [x] Pike Push-ups — key `bodyweight-pike-push-up`, component `BodyweightPikePushUpIcon`, pose `pike`
- [x] Shoulder Taps — key `bodyweight-shoulder-taps`, component `BodyweightShoulderTapsIcon`, pose `prone-brace`

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

- [x] Barbell Calf Raises — key `barbell-calf-raise`, component `BarbellCalfRaiseIcon`, pose `standing-raise`
- [x] Barbell Good Mornings — key `barbell-good-morning`, component `BarbellGoodMorningIcon`, pose `hinge`
- [x] Barbell Hip Thrust — key `barbell-hip-thrust`, component `BarbellHipThrustIcon`, pose `supine-bridge`
- [x] Barbell Lunges — key `barbell-lunge`, component `BarbellLungeIcon`, pose `lunge`
- [x] Barbell Romanian Deadlift — key `barbell-romanian-deadlift`, component `BarbellRomanianDeadliftIcon`, pose `hinge`
- [x] Front Squat — key `barbell-front-squat`, component `BarbellFrontSquatIcon`, pose `squat`
- [x] Sumo Deadlift — key `barbell-sumo-deadlift`, component `BarbellSumoDeadliftIcon`, pose `hinge`
- [x] Dumbbell Bulgarian Split Squat — key `dumbbell-bulgarian-split-squat`, component `DumbbellBulgarianSplitSquatIcon`, pose `split-squat`
- [x] Dumbbell Calf Raises — key `dumbbell-calf-raise`, component `DumbbellCalfRaiseIcon`, pose `standing-raise`
- [x] Dumbbell Goblet Squat — key `dumbbell-goblet-squat`, component `DumbbellGobletSquatIcon`, pose `goblet-squat`
- [x] Dumbbell Hip Thrust — key `dumbbell-hip-thrust`, component `DumbbellHipThrustIcon`, pose `supine-bridge`
- [x] Dumbbell Lunges — key `dumbbell-lunge`, component `DumbbellLungeIcon`, pose `lunge`
- [x] Dumbbell Romanian Deadlift — key `dumbbell-romanian-deadlift`, component `DumbbellRomanianDeadliftIcon`, pose `hinge`
- [x] Dumbbell Single Leg Deadlift — key `dumbbell-single-leg-deadlift`, component `DumbbellSingleLegDeadliftIcon`, pose `single-leg-hinge`
- [x] Dumbbell Step-ups — key `dumbbell-step-up`, component `DumbbellStepUpIcon`, pose `step-up`
- [x] Dumbbell Sumo Squat — key `dumbbell-sumo-squat`, component `DumbbellSumoSquatIcon`, pose `squat`
- [x] Kettlebell Single Leg Deadlift — key `kettlebell-single-leg-deadlift`, component `KettlebellSingleLegDeadliftIcon`, pose `single-leg-hinge`
- [x] Kettlebell Thruster — key `kettlebell-thruster`, component `KettlebellThrusterIcon`, pose `squat-press`
- [x] Cable Kickbacks — key `cable-kickback`, component `CableKickbackIcon`, pose `standing-kickback`
- [x] Cable Pull-Through — key `cable-pull-through`, component `CablePullThroughIcon`, pose `hinge`
- [x] Cable Romanian Deadlift — key `cable-romanian-deadlift`, component `CableRomanianDeadliftIcon`, pose `hinge`

## legs-machine

- [x] Belt Squat Machine — key `machine-belt-squat`, component `MachineBeltSquatIcon`, pose `squat`
- [x] Donkey Calf Raise Machine — key `machine-donkey-calf-raise`, component `MachineDonkeyCalfRaiseIcon`, pose `hinged-raise`
- [x] Glute Drive Machine — key `machine-glute-drive`, component `MachineGluteDriveIcon`, pose `supine-bridge`
- [x] Glute Kickback Machine — key `machine-glute-kickback`, component `MachineGluteKickbackIcon`, pose `standing-kickback`
- [x] Hack Squat Machine — key `machine-hack-squat`, component `MachineHackSquatIcon`, pose `sled-squat`
- [x] Hip Abduction Machine — key `machine-hip-abduction`, component `MachineHipAbductionIcon`, pose `seated-legs-open`
- [x] Hip Adduction Machine — key `machine-hip-adduction`, component `MachineHipAdductionIcon`, pose `seated-legs-closed`
- [x] Hip Thrust Machine — key `machine-hip-thrust`, component `MachineHipThrustIcon`, pose `supine-bridge`
- [x] Leg Curl — key `machine-leg-curl`, component `MachineLegCurlIcon`, pose `seated-curl-leg`
- [x] Leg Extension — key `machine-leg-extension`, component `MachineLegExtensionIcon`, pose `seated-extension-leg`
- [x] Leg Press — key `machine-leg-press`, component `MachineLegPressIcon`, pose `seated-leg-press`
- [x] Leg Press Calf Raise — key `machine-leg-press-calf-raise`, component `MachineLegPressCalfRaiseIcon`, pose `seated-leg-press`
- [x] Lying Leg Curl — key `machine-lying-leg-curl`, component `MachineLyingLegCurlIcon`, pose `prone-curl-leg`
- [x] Nordic Curl Machine — key `machine-nordic-curl`, component `MachineNordicCurlIcon`, pose `kneeling-lower`
- [x] Pendulum Squat — key `machine-pendulum-squat`, component `MachinePendulumSquatIcon`, pose `sled-squat`
- [x] Reverse Hack Squat — key `machine-reverse-hack-squat`, component `MachineReverseHackSquatIcon`, pose `sled-squat`
- [x] Seated Calf Raise — key `machine-seated-calf-raise`, component `MachineSeatedCalfRaiseIcon`, pose `seated-raise`
- [x] Seated Leg Curl — key `machine-seated-leg-curl`, component `MachineSeatedLegCurlIcon`, pose `seated-curl-leg`
- [x] Sissy Squat Machine — key `machine-sissy-squat`, component `MachineSissySquatIcon`, pose `lean-back-squat`
- [x] Smith Machine Lunges — key `smith-machine-lunge`, component `SmithMachineLungeIcon`, pose `lunge`
- [x] Smith Machine Romanian Deadlift — key `smith-machine-romanian-deadlift`, component `SmithMachineRomanianDeadliftIcon`, pose `hinge`
- [x] Smith Machine Squat — key `smith-machine-squat`, component `SmithMachineSquatIcon`, pose `squat`
- [x] Standing Calf Raise Machine — key `machine-standing-calf-raise`, component `MachineStandingCalfRaiseIcon`, pose `standing-raise`
- [x] Standing Leg Curl — key `machine-standing-leg-curl`, component `MachineStandingLegCurlIcon`, pose `standing-curl-leg`
- [x] V-Squat Machine — key `machine-v-squat`, component `MachineVSquatIcon`, pose `sled-squat`
- [x] Vertical Leg Press — key `machine-vertical-leg-press`, component `MachineVerticalLegPressIcon`, pose `supine-leg-press`

## legs-bodyweight

- [x] Bodyweight Squat — key `bodyweight-squat`, component `BodyweightSquatIcon`, pose `squat`
- [x] Bulgarian Split Squat — key `bodyweight-bulgarian-split-squat`, component `BodyweightBulgarianSplitSquatIcon`, pose `split-squat`
- [x] Burpees — key `bodyweight-burpee`, component `BodyweightBurpeeIcon`, pose `jump`
- [x] Butt Kicks — key `bodyweight-butt-kicks`, component `BodyweightButtKicksIcon`, pose `run`
- [x] Calf Raises — key `bodyweight-calf-raise`, component `BodyweightCalfRaiseIcon`, pose `standing-raise`
- [x] Donkey Kicks — key `bodyweight-donkey-kick`, component `BodyweightDonkeyKickIcon`, pose `quadruped-kick`
- [x] Glute Bridge Hold — key `bodyweight-glute-bridge-hold`, component `BodyweightGluteBridgeHoldIcon`, pose `supine-bridge`
- [x] Glute Bridges — key `bodyweight-glute-bridge`, component `BodyweightGluteBridgeIcon`, pose `supine-bridge`
- [x] High Knees — key `bodyweight-high-knees`, component `BodyweightHighKneesIcon`, pose `run`
- [x] Jump Lunges — key `bodyweight-jump-lunge`, component `BodyweightJumpLungeIcon`, pose `jump-lunge`
- [x] Jump Rope — key `bodyweight-jump-rope`, component `BodyweightJumpRopeIcon`, pose `jump-rope`
- [x] Jump Squats — key `bodyweight-jump-squat`, component `BodyweightJumpSquatIcon`, pose `jump`
- [x] Jumping Jacks — key `bodyweight-jumping-jacks`, component `BodyweightJumpingJacksIcon`, pose `star-jump`
- [x] Lunges — key `bodyweight-lunge`, component `BodyweightLungeIcon`, pose `lunge`
- [x] Pistol Squats — key `bodyweight-pistol-squat`, component `BodyweightPistolSquatIcon`, pose `single-leg-squat`
- [x] Reverse Lunges — key `bodyweight-reverse-lunge`, component `BodyweightReverseLungeIcon`, pose `lunge`
- [x] Single Leg Glute Bridge — key `bodyweight-single-leg-glute-bridge`, component `BodyweightSingleLegGluteBridgeIcon`, pose `supine-bridge`
- [x] Sprawls — key `bodyweight-sprawl`, component `BodyweightSprawlIcon`, pose `prone-thrust`
- [x] Squat Thrusts — key `bodyweight-squat-thrust`, component `BodyweightSquatThrustIcon`, pose `prone-thrust`
- [x] Step-ups — key `bodyweight-step-up`, component `BodyweightStepUpIcon`, pose `step-up`
- [x] Tuck Jumps — key `bodyweight-tuck-jump`, component `BodyweightTuckJumpIcon`, pose `jump`
- [x] Walking Lunges — key `bodyweight-walking-lunge`, component `BodyweightWalkingLungeIcon`, pose `lunge`
- [x] Wall Sit — key `bodyweight-wall-sit`, component `BodyweightWallSitIcon`, pose `wall-sit`

## core

- [x] Kettlebell Figure 8 — key `kettlebell-figure-8`, component `KettlebellFigure8Icon`, pose `rotation`
- [x] Kettlebell Windmill — key `kettlebell-windmill`, component `KettlebellWindmillIcon`, pose `windmill`
- [x] Weighted Plank — key `dumbbell-weighted-plank`, component `DumbbellWeightedPlankIcon`, pose `prone-brace`
- [x] Cable Crunch — key `cable-crunch`, component `CableCrunchIcon`, pose `kneeling-crunch`
- [x] Cable Woodchop — key `cable-woodchop`, component `CableWoodchopIcon`, pose `rotation`
- [x] Bear Crawl — key `bodyweight-bear-crawl`, component `BodyweightBearCrawlIcon`, pose `quadruped`
- [x] Bicycle Crunches — key `bodyweight-bicycle-crunch`, component `BodyweightBicycleCrunchIcon`, pose `supine-crunch`
- [x] Bird Dog — key `bodyweight-bird-dog`, component `BodyweightBirdDogIcon`, pose `quadruped-reach`
- [x] Bodyweight Get-up — key `bodyweight-get-up`, component `BodyweightGetUpIcon`, pose `ground-to-standing`
- [x] Crunches — key `bodyweight-crunch`, component `BodyweightCrunchIcon`, pose `supine-crunch`
- [x] Dead Bug — key `bodyweight-dead-bug`, component `BodyweightDeadBugIcon`, pose `supine-reach`
- [x] Flutter Kicks — key `bodyweight-flutter-kicks`, component `BodyweightFlutterKicksIcon`, pose `supine-kick`
- [x] Hollow Body Hold — key `bodyweight-hollow-body-hold`, component `BodyweightHollowBodyHoldIcon`, pose `supine-hollow`
- [x] Inchworms — key `bodyweight-inchworm`, component `BodyweightInchwormIcon`, pose `pike-walk`
- [x] L-Sit — key `bodyweight-l-sit`, component `BodyweightLSitIcon`, pose `support-hold`
- [x] Leg Raises — key `bodyweight-leg-raise`, component `BodyweightLegRaiseIcon`, pose `supine-kick`
- [x] Mountain Climbers — key `bodyweight-mountain-climber`, component `BodyweightMountainClimberIcon`, pose `prone-drive`
- [x] Plank to Pike — key `bodyweight-plank-to-pike`, component `BodyweightPlankToPikeIcon`, pose `pike`
- [x] Reverse Crunches — key `bodyweight-reverse-crunch`, component `BodyweightReverseCrunchIcon`, pose `supine-crunch`
- [x] Russian Twists — key `bodyweight-russian-twist`, component `BodyweightRussianTwistIcon`, pose `seated-twist`
- [x] Side Plank — key `bodyweight-side-plank`, component `BodyweightSidePlankIcon`, pose `side-brace`
- [x] Sit-ups — key `bodyweight-sit-up`, component `BodyweightSitUpIcon`, pose `supine-crunch`
- [x] Superman — key `bodyweight-superman`, component `BodyweightSupermanIcon`, pose `prone-raise`
- [x] Toe Touches — key `bodyweight-toe-touch`, component `BodyweightToeTouchIcon`, pose `supine-reach`
- [x] V-ups — key `bodyweight-v-up`, component `BodyweightVUpIcon`, pose `supine-fold`
- [x] Club Pendulum — key `club-pendulum`, component `ClubPendulumIcon`, pose `club-swing`

## Wrap-up checklist

- [x] manifest.ts entries for all 163 (aliases unique, exact catalog names)
- [x] pnpm generate:exercise-icons (rewrites generated/iconKeys|iconAliases|iconRegistry)
- [x] update src/__tests__/components/exercise-icons/ExerciseIcon.spec.ts (10 -> 173, pilot-names test, add all-popular-exercises-resolve test)
- [x] update manifest.ts header comment (no longer pilot-only)
- [x] pnpm type-check && pnpm lint && pnpm test
- [x] commit + push claude/missing-icon-exercises-xjss75
