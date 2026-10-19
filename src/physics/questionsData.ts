import { PhysicsProblem } from '../types/game';

export const G_CONST = 6.6743e-11;
export const G_EARTH = 9.80665; // m/s^2

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateAllProblems(): PhysicsProblem[] {
  const problems: PhysicsProblem[] = [
    // 1. Newton's Law of Universal Gravitation
    {
      id: 'prob-1',
      topicId: 'newton_gravitation',
      topicNumber: '01',
      topicTitle: "Newton's Law of Universal Gravitation",
      chamberName: 'Chamber of the Celestial Tether',
      narrativeContext:
        'The deep space docking array is tracking an automated supply shuttle approaching the lunar scientific orbital station. The station telemetry reads an erratic oscillation in the mooring cables. You must verify the mutual gravitational attraction force between the two bodies to prevent a catastrophic collision.',
      problemStatement:
        'Calculate the magnitude of gravitational force F between the Orbital Station (mass m₁ = 4.20 × 10⁵ kg) and the Lunar Supply Shuttle (mass m₂ = 2.80 × 10⁴ kg) when separated by center-to-center distance r = 150 meters.',
      formula: 'F = G · (m₁ · m₂) / r²',
      variables: {
        'Gravitational Constant (G)': '6.674 × 10⁻¹¹ N·m²/kg²',
        'Station Mass (m₁)': '4.20 × 10⁵ kg',
        'Shuttle Mass (m₂)': '2.80 × 10⁴ kg',
        'Separation Distance (r)': '150.0 m',
      },
      correctValue: 0.0349,
      tolerance: 0.05,
      unit: 'N',
      options: shuffle([
        {
          id: 'opt-1a',
          label: '0.0349 N',
          value: 0.0349,
          explanation: 'Accurate: F = (6.674×10⁻¹¹ × 4.20×10⁵ × 2.80×10⁴) / 150² ≈ 3.49×10⁻² N.',
          isCorrect: true,
        },
        {
          id: 'opt-1b',
          label: '5.2300 N',
          value: 5.23,
          explanation: 'Incorrect: Forgot to square the distance r in the denominator.',
          isCorrect: false,
        },
        {
          id: 'opt-1c',
          label: '0.0002 N',
          value: 0.00023,
          explanation: 'Incorrect: Miscalculated powers of ten for mass variables.',
          isCorrect: false,
        },
        {
          id: 'opt-1d',
          label: '124.60 N',
          value: 124.6,
          explanation: 'Incorrect: Applied Earth standard surface gravity instead of universal G.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-1-erudition',
          text: 'Calibrate micro-thrusters to exactly counter the calculated drift with mathematical precision.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'Telemetry stabilizes without a single wasted watt. The orbital log notes zero error margin.',
        },
        {
          id: 'nc-1-hunt',
          text: 'Fire rapid burst RCS thrusters immediately; speed is crucial before relative velocity drifts.',
          pathAffinity: 'Hunt',
          affinityPoints: 5,
          consequence: 'Docking clamps lock into place in record seconds. Fast and decisive.',
        },
        {
          id: 'nc-1-destruction',
          text: 'Vent excess ballast gas violently into the vacuum to blast the shuttle into alignment.',
          pathAffinity: 'Destruction',
          affinityPoints: 5,
          consequence: 'The shuttle lurches into lock with a metallic shudder, scoring the docking ring.',
        },
        {
          id: 'nc-1-equilibrium',
          text: 'Engage symmetric magnetic counter-weights so both vessels absorb equal kinetic momentum.',
          pathAffinity: 'Equilibrium',
          affinityPoints: 5,
          consequence: 'Both hulls rest in serene geometric alignment, neither exerting undue torque.',
        },
      ],
      apparatusType: 'orrery_gravity',
      apparatusParams: {
        m1: 4.2e5,
        m2: 2.8e4,
        distance: 150,
        showVectors: true,
      },
    },

    // 2. Acceleration due to Gravity given Mass and Radius
    {
      id: 'prob-2',
      topicId: 'gravity_acceleration',
      topicNumber: '02',
      topicTitle: 'Surface Gravity Acceleration (g = GM/R²)',
      chamberName: 'Sanctuary of the Martian Descent',
      narrativeContext:
        'Your suit navigation computer is projecting descent thruster burns for the Martian colony outpost on Olympus Mons. The lander suspension hydraulics must be configured to the local gravitational field of Mars to cushion touchdown.',
      problemStatement:
        'Determine the surface gravitational acceleration g_mars on Mars, given its planetary mass M = 6.417 × 10²³ kg and mean volumetric radius R = 3.390 × 10⁶ meters (3,390 km).',
      formula: 'g = G · M / R²',
      variables: {
        'Gravitational Constant (G)': '6.674 × 10⁻¹¹ N·m²/kg²',
        'Planetary Mass (M)': '6.417 × 10²³ kg',
        'Mean Radius (R)': '3.390 × 10⁶ m',
      },
      correctValue: 3.72,
      tolerance: 0.05,
      unit: 'm/s²',
      options: shuffle([
        {
          id: 'opt-2a',
          label: '3.72 m/s²',
          value: 3.72,
          explanation: 'Accurate: g = (6.674×10⁻¹¹ × 6.417×10²³) / (3.390×10⁶)² = 3.727 m/s².',
          isCorrect: true,
        },
        {
          id: 'opt-2b',
          label: '9.81 m/s²',
          value: 9.81,
          explanation: 'Incorrect: That is Earth surface gravity, not Mars.',
          isCorrect: false,
        },
        {
          id: 'opt-2c',
          label: '1.62 m/s²',
          value: 1.62,
          explanation: 'Incorrect: That is the gravitational acceleration of the Moon.',
          isCorrect: false,
        },
        {
          id: 'opt-2d',
          label: '12.60 m/s²',
          value: 12.6,
          explanation: 'Incorrect: Underestimated radius by an order of magnitude.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-2-abundance',
          text: 'Tune the suspension dampers softly to protect delicate hydroponic seed containers aboard.',
          pathAffinity: 'Abundance',
          affinityPoints: 5,
          consequence: 'The seedling modules stay perfectly cushioned, ready to bloom under Martian soil.',
        },
        {
          id: 'nc-2-erudition',
          text: 'Record the exact 3.727 m/s² telemetry to recalibrate atmospheric barometric sensors.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'Sensor noise drops to baseline zero; the colony telemetry is pristine.',
        },
        {
          id: 'nc-2-elation',
          text: 'Leverage the low gravity to execute an adventurous, bounding high-jump maneuver!',
          pathAffinity: 'Elation',
          affinityPoints: 5,
          consequence: 'You soar in the light gravity with giddy exhilaration across the red dune.',
        },
        {
          id: 'nc-2-nihility',
          text: 'Acknowledge that planetary mass dictates all descent, and let the ship glide without struggle.',
          pathAffinity: 'Nihility',
          affinityPoints: 5,
          consequence: 'The descent is quiet and tranquil, accepting the inexorable pull of gravity.',
        },
      ],
      apparatusType: 'planetary_orbit',
      apparatusParams: {
        mass: 6.417e23,
        radius: 3.39e6,
        surfaceG: 3.72,
      },
    },

    // 3. Gravitational Potential Energy based on orbital distance
    {
      id: 'prob-3',
      topicId: 'orbital_gpe',
      topicNumber: '03',
      topicTitle: 'Orbital Gravitational Potential Energy (U = -GMm/r)',
      chamberName: 'Observatory of the Bound Singularity',
      narrativeContext:
        'A geostationary reconnaissance probe orbiting Earth is preparing for a transfer orbit to escape a solar coronal mass ejection. The reactor needs to compute the negative potential well depth relative to infinity.',
      problemStatement:
        'Calculate the Gravitational Potential Energy U of a weather satellite (m = 1,200 kg) orbiting Earth (M = 5.972 × 10²⁴ kg) at geostationary orbital radius r = 4.216 × 10⁷ m (42,160 km from Earth center).',
      formula: 'U = - (G · M · m) / r',
      variables: {
        'Earth Mass (M)': '5.972 × 10²⁴ kg',
        'Satellite Mass (m)': '1,200 kg',
        'Orbital Radius (r)': '4.216 × 10⁷ m',
        'Gravitational Constant (G)': '6.674 × 10⁻¹¹ N·m²/kg²',
      },
      correctValue: -11.34,
      tolerance: 0.05,
      unit: 'GJ',
      options: shuffle([
        {
          id: 'opt-3a',
          label: '-11.34 GJ',
          value: -11.34,
          explanation: 'Accurate: U = -(6.674×10⁻¹¹ × 5.972×10²⁴ × 1200) / 4.216×10⁷ = -1.134×10¹⁰ J = -11.34 GJ.',
          isCorrect: true,
        },
        {
          id: 'opt-3b',
          label: '+47.80 GJ',
          value: 47.8,
          explanation: 'Incorrect: Gravitational potential in an attractive field is negative relative to infinity.',
          isCorrect: false,
        },
        {
          id: 'opt-3c',
          label: '-0.27 GJ',
          value: -0.27,
          explanation: 'Incorrect: Used orbital altitude instead of center-to-center radius.',
          isCorrect: false,
        },
        {
          id: 'opt-3d',
          label: '-845.20 GJ',
          value: -845.2,
          explanation: 'Incorrect: Squared the radius as if calculating force instead of energy.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-3-remembrance',
          text: 'Archive the telemetry vector in the station memory core to honor past orbital pioneers.',
          pathAffinity: 'Remembrance',
          affinityPoints: 5,
          consequence: 'The historical flight ledger records your preservation of ancestral telemetry.',
        },
        {
          id: 'nc-3-erudition',
          text: 'Compute the escape velocity burn to the exact joule, leaving zero orbital perturbation.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'The transfer burn is a masterclass in Keplerian orbital mechanics.',
        },
        {
          id: 'nc-3-destruction',
          text: 'Slingshot through the upper radiation belt, using extreme tidal stress to break orbit fast.',
          pathAffinity: 'Destruction',
          affinityPoints: 5,
          consequence: 'Sparks fly along the hull as the probe slingshots free with violent acceleration.',
        },
        {
          id: 'nc-3-equilibrium',
          text: 'Symmetrize the perigee and apogee thruster burns to maintain circular harmonic orbit.',
          pathAffinity: 'Equilibrium',
          affinityPoints: 5,
          consequence: 'The orbital eccentricity settles to a pristine 0.0000 circle.',
        },
      ],
      apparatusType: 'gravity_potential',
      apparatusParams: {
        wellDepth: 11.34,
        satelliteMass: 1200,
        radiusGEO: 42160,
      },
    },

    // 4. Gravitational Potential Energy of Near-Earth Objects
    {
      id: 'prob-4',
      topicId: 'near_earth_gpe',
      topicNumber: '04',
      topicTitle: 'Near-Earth Gravitational Potential Energy (U = mgh)',
      chamberName: 'The Kinetic Drop Spire',
      narrativeContext:
        'A seismic emergency bulkhead mechanism inside the labyrinth relies on a suspended solid tungsten counterweight drop-shaft to slam the blast doors shut in case of decompression.',
      problemStatement:
        'Calculate the Gravitational Potential Energy U of the tungsten counterweight (mass m = 850 kg) hoisted to a height h = 45.0 meters above the baseline impact trigger (taking standard g = 9.81 m/s²).',
      formula: 'U = m · g · h',
      variables: {
        'Counterweight Mass (m)': '850 kg',
        'Height above release trigger (h)': '45.0 m',
        'Standard Gravitational Acceleration (g)': '9.81 m/s²',
      },
      correctValue: 375.2,
      tolerance: 0.05,
      unit: 'kJ',
      options: shuffle([
        {
          id: 'opt-4a',
          label: '375.2 kJ',
          value: 375.2,
          explanation: 'Accurate: U = 850 kg × 9.81 m/s² × 45.0 m = 375,232.5 J ≈ 375.2 kJ.',
          isCorrect: true,
        },
        {
          id: 'opt-4b',
          label: '38.2 kJ',
          value: 38.2,
          explanation: 'Incorrect: Off by a factor of 10 in mechanical work multiplication.',
          isCorrect: false,
        },
        {
          id: 'opt-4c',
          label: '1,890.0 kJ',
          value: 1890.0,
          explanation: 'Incorrect: Multiplied velocity squared instead of height.',
          isCorrect: false,
        },
        {
          id: 'opt-4d',
          label: '8.34 kJ',
          value: 8.34,
          explanation: 'Incorrect: Divided mass by height instead of multiplying.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-4-destruction',
          text: 'Release the catch at full kinetic energy to crush the blast door seal irrevocably shut.',
          pathAffinity: 'Destruction',
          affinityPoints: 5,
          consequence: 'A deafening sonic boom reverberates as the 375 kJ impact obliterates the gate lock.',
        },
        {
          id: 'nc-4-abundance',
          text: 'Couple the descending weight to an emergency dynamo to recharge local oxygen generators.',
          pathAffinity: 'Abundance',
          affinityPoints: 5,
          consequence: 'The drop smoothly powers the life-support grid, filling the sector with fresh air.',
        },
        {
          id: 'nc-4-hunt',
          text: 'Time the fall to exact microsecond triggers to bypass the labyrinth security grid in one run.',
          pathAffinity: 'Hunt',
          affinityPoints: 5,
          consequence: 'You slip past the descending gate just as it drops, shaving precious minutes.',
        },
        {
          id: 'nc-4-erudition',
          text: 'Calibrate the magnetic eddy-current brake to convert kinetic energy into measurable thermal logs.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'Thermodynamic equilibrium is reached smoothly with zero shockwear.',
        },
      ],
      apparatusType: 'drop_tower',
      apparatusParams: {
        mass: 850,
        height: 45,
        energyKJ: 375.2,
      },
    },

    // 5. Density
    {
      id: 'prob-5',
      topicId: 'density',
      topicNumber: '05',
      topicTitle: 'Density of Matter (ρ = m / V)',
      chamberName: 'Hall of Metallurgical Purity',
      narrativeContext:
        'An alloy cube rests inside an illuminated hermetic inspection chamber. To unlock the labyrinth conduit, the metallurgical sensor demands you compute its density to verify its material classification.',
      problemStatement:
        'A precision-machined solid rectangular specimen with dimensions 0.20 m × 0.15 m × 0.10 m has a measured mass m = 13.50 kg. Compute its material density ρ in kg/m³.',
      formula: 'ρ = m / V  where V = length × width × height',
      variables: {
        'Length': '0.20 m',
        'Width': '0.15 m',
        'Height': '0.10 m',
        'Sample Mass (m)': '13.50 kg',
      },
      correctValue: 4500,
      tolerance: 0.05,
      unit: 'kg/m³',
      options: shuffle([
        {
          id: 'opt-5a',
          label: '4,500 kg/m³',
          value: 4500,
          explanation: 'Accurate: Volume V = 0.20 × 0.15 × 0.10 = 0.003 m³. ρ = 13.50 / 0.003 = 4,500 kg/m³.',
          isCorrect: true,
        },
        {
          id: 'opt-5b',
          label: '2,700 kg/m³',
          value: 2700,
          explanation: 'Incorrect: Aluminum has a much lower mass for this volume.',
          isCorrect: false,
        },
        {
          id: 'opt-5c',
          label: '7,870 kg/m³',
          value: 7870,
          explanation: 'Incorrect: Steel would have a mass around 23.6 kg.',
          isCorrect: false,
        },
        {
          id: 'opt-5d',
          label: '19,300 kg/m³',
          value: 19300,
          explanation: 'Incorrect: Gold is over four times as dense.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-5-erudition',
          text: 'Attest to the titanium purity and encode the atomic lattice constant into the console.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'The console chiming in pure harmonics accepts the crystallographic proof.',
        },
        {
          id: 'nc-5-remembrance',
          text: 'Catalog the sample alongside the ancient metallurgist manufacturer hallmark.',
          pathAffinity: 'Remembrance',
          affinityPoints: 5,
          consequence: 'A forgotten forge foundry from Earth Golden Age is rediscovered in memory.',
        },
        {
          id: 'nc-5-elation',
          text: 'Spin the titanium block playfully on its apex to test its rotational inertia!',
          pathAffinity: 'Elation',
          affinityPoints: 5,
          consequence: 'The block spins like a gleaming mirror top, reflecting the chamber light joyously.',
        },
        {
          id: 'nc-5-nihility',
          text: 'Reflect on how even this dense titanium will decay into rust across billions of years.',
          pathAffinity: 'Nihility',
          affinityPoints: 5,
          consequence: 'With solemn calm, you register the density and watch the dust settle.',
        },
      ],
      apparatusType: 'density_beaker',
      apparatusParams: {
        density: 4500,
        mass: 13.5,
        volume: 0.003,
      },
    },

    // 6a. Hydrostatic Pressure: Barometer
    {
      id: 'prob-6a',
      topicId: 'barometer',
      topicNumber: '06a',
      topicTitle: 'Hydrostatic Pressure: Torricellian Barometer',
      chamberName: 'Torricelli Atmospheric Vault',
      narrativeContext:
        'The outer airlock is sensing external atmospheric pressure on an alien biosphere dome. A classic mercury barometer column stands calibrated against the vacuum headspace. You must calculate the exact atmospheric pressure from the mercury column height.',
      problemStatement:
        'A Torricellian mercury barometer column measures height h = 0.742 meters (742 mmHg) above the open reservoir. Calculate the ambient atmospheric pressure P_atm, given mercury density ρ = 13,595 kg/m³ and local g = 9.807 m/s².',
      formula: 'P = ρ · g · h',
      variables: {
        'Liquid': 'Liquid Mercury (Hg)',
        'Mercury Density (ρ)': '13,595 kg/m³',
        'Column Height (h)': '0.742 m',
        'Local Gravity (g)': '9.807 m/s²',
      },
      correctValue: 98.93,
      tolerance: 0.05,
      unit: 'kPa',
      options: shuffle([
        {
          id: 'opt-6a-1',
          label: '98.93 kPa',
          value: 98.93,
          explanation: 'Accurate: P = 13,595 kg/m³ × 9.807 m/s² × 0.742 m = 98,929 Pa ≈ 98.93 kPa.',
          isCorrect: true,
        },
        {
          id: 'opt-6a-2',
          label: '101.30 kPa',
          value: 101.3,
          explanation: 'Incorrect: That is sea-level standard (760 mmHg), but here the column is 742 mm.',
          isCorrect: false,
        },
        {
          id: 'opt-6a-3',
          label: '74.20 kPa',
          value: 74.2,
          explanation: 'Incorrect: Confused millimeters of mercury directly with kilopascals.',
          isCorrect: false,
        },
        {
          id: 'opt-6a-4',
          label: '133.40 kPa',
          value: 133.4,
          explanation: 'Incorrect: Multiplied instead of correctly evaluating liquid hydrostatic head.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-6a-abundance',
          text: 'Equalize habitat pressure gently to 98.9 kPa to avoid ear barotrauma for sleeping travelers.',
          pathAffinity: 'Abundance',
          affinityPoints: 5,
          consequence: 'The air vents softly equalize without a shudder, keeping the habitat serene.',
        },
        {
          id: 'nc-6a-erudition',
          text: 'Document the barometric gradient to chart the storm front sweeping across the outer desert.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'Meteorological telemetry is logged with scientific accuracy.',
        },
        {
          id: 'nc-6a-hunt',
          text: 'Override the slow pneumatic valve to depressurize immediately and sprint through.',
          pathAffinity: 'Hunt',
          affinityPoints: 5,
          consequence: 'A sharp hiss echoes as the door opens instantly to clear your forward path.',
        },
        {
          id: 'nc-6a-equilibrium',
          text: 'Calibrate the dual ballast chambers so internal and external pressure match to the pascal.',
          pathAffinity: 'Equilibrium',
          affinityPoints: 5,
          consequence: 'The pressure differential needle points dead center at 0.00 Pa delta.',
        },
      ],
      apparatusType: 'barometer_tube',
      apparatusParams: {
        heightM: 0.742,
        densityHg: 13595,
        pressureKPa: 98.93,
      },
    },

    // 6b. Hydrostatic Pressure: Manometer
    {
      id: 'prob-6b',
      topicId: 'manometer',
      topicNumber: '06b',
      topicTitle: 'Hydrostatic Pressure: U-Tube Differential Manometer',
      chamberName: 'Subterranean Pneumatic Manifold',
      narrativeContext:
        'A pressurized coolant conduit in the geothermal reactor room is sealed behind a glass U-tube manometer containing dyed fluid. To diagnose if the coolant gas is over-pressurized, you must calculate the gauge differential pressure ΔP.',
      problemStatement:
        'An open-ended U-tube manometer filled with oil (density ρ = 880 kg/m³) is connected to a reactor gas tank. The fluid level in the open arm is Δh = 0.350 meters higher than in the container arm. Calculate the gauge pressure ΔP = P_gas - P_atm (taking g = 9.81 m/s²).',
      formula: 'ΔP = ρ · g · Δh',
      variables: {
        'Manometer Fluid': 'Coolant Oil',
        'Fluid Density (ρ)': '880 kg/m³',
        'Differential Height (Δh)': '0.350 m',
        'Local Gravity (g)': '9.81 m/s²',
      },
      correctValue: 3.02,
      tolerance: 0.05,
      unit: 'kPa',
      options: shuffle([
        {
          id: 'opt-6b-1',
          label: '3.02 kPa',
          value: 3.02,
          explanation: 'Accurate: ΔP = 880 kg/m³ × 9.81 m/s² × 0.350 m = 3,021.5 Pa ≈ 3.02 kPa gauge.',
          isCorrect: true,
        },
        {
          id: 'opt-6b-2',
          label: '34.50 kPa',
          value: 34.5,
          explanation: 'Incorrect: Mistook oil density for mercury density.',
          isCorrect: false,
        },
        {
          id: 'opt-6b-3',
          label: '0.86 kPa',
          value: 0.86,
          explanation: 'Incorrect: Omitted gravitational acceleration g from the hydrostatic equation.',
          isCorrect: false,
        },
        {
          id: 'opt-6b-4',
          label: '104.30 kPa',
          value: 104.3,
          explanation: 'Incorrect: Calculated absolute pressure assuming atmospheric addition instead of gauge pressure.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-6b-erudition',
          text: 'Record the exact differential pressure head into the thermodynamic log for continuous analysis.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'The fluid dynamics model converges cleanly with your calculated head pressure.',
        },
        {
          id: 'nc-6b-destruction',
          text: 'Vent the excess pressure in a roaring plume of steam to rapidly purge the piping lines.',
          pathAffinity: 'Destruction',
          affinityPoints: 5,
          consequence: 'Superheated steam screeches as valves release with thunderous ferocity.',
        },
        {
          id: 'nc-6b-abundance',
          text: 'Route the pressurized coolant into dormant agricultural hydration coils to prevent overheating.',
          pathAffinity: 'Abundance',
          affinityPoints: 5,
          consequence: 'Warm nutrient liquid flows smoothly through the nursery beds.',
        },
        {
          id: 'nc-6b-elation',
          text: 'Whistle along with the rhythmic harmonic vibrations humming through the U-tube glass!',
          pathAffinity: 'Elation',
          affinityPoints: 5,
          consequence: 'The fluid oscillates rhythmically like a whimsical musical instrument.',
        },
      ],
      apparatusType: 'manometer_tube',
      apparatusParams: {
        deltaH: 0.35,
        densityFluid: 880,
        deltaPKPa: 3.02,
      },
    },

    // 6c. Hydrostatic Pressure: Sphygmomanometer
    {
      id: 'prob-6c',
      topicId: 'sphygmomanometer',
      topicNumber: '06c',
      topicTitle: 'Hydrostatic Pressure: Medical Sphygmomanometer',
      chamberName: 'Cryo-Medical Stasis Station',
      narrativeContext:
        'A life-support cryo-pod holding an astronaut in suspended animation requires vital sign calibration. The automated sphygmomanometer cuff must convert a measured clinical arterial pressure in millimeters of mercury (mmHg) to SI pascals (Pa) to interface with the spacecraft life-support computer.',
      problemStatement:
        'The patient’s systolic blood pressure reading on the mercury column gauge is h = 120 mmHg (0.120 m Hg). Convert this hydrostatic pressure into SI Pascals (Pa), using mercury density ρ = 13,595 kg/m³ and standard g = 9.80665 m/s².',
      formula: 'P = ρ · g · h',
      variables: {
        'Gauge Reading (h)': '120 mmHg (0.120 m Hg)',
        'Mercury Density (ρ)': '13,595 kg/m³',
        'Standard Gravity (g)': '9.80665 m/s²',
      },
      correctValue: 16.0,
      tolerance: 0.05,
      unit: 'kPa',
      options: shuffle([
        {
          id: 'opt-6c-1',
          label: '16.00 kPa',
          value: 16.0,
          explanation: 'Accurate: P = 13,595 × 9.80665 × 0.120 = 15,998.6 Pa ≈ 16.00 kPa.',
          isCorrect: true,
        },
        {
          id: 'opt-6c-2',
          label: '1.20 kPa',
          value: 1.2,
          explanation: 'Incorrect: Merely divided 120 by 100 without physical density conversion.',
          isCorrect: false,
        },
        {
          id: 'opt-6c-3',
          label: '120.00 kPa',
          value: 120.0,
          explanation: 'Incorrect: 120 kPa would be over 900 mmHg—a lethal catastrophic pressure.',
          isCorrect: false,
        },
        {
          id: 'opt-6c-4',
          label: '8.45 kPa',
          value: 8.45,
          explanation: 'Incorrect: Corresponds to diastolic ~63 mmHg instead of systolic 120 mmHg.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-6c-abundance',
          text: 'Administer stabilizing saline solution to maintain the subject in restorative homeostasis.',
          pathAffinity: 'Abundance',
          affinityPoints: 5,
          consequence: 'The vitals display glows warm green. The astronaut’s bio-resonance is serene.',
        },
        {
          id: 'nc-6c-remembrance',
          text: 'Read the astronaut’s medical logbook to learn of their past interstellar missions.',
          pathAffinity: 'Remembrance',
          affinityPoints: 5,
          consequence: 'Old star charts and recorded crew memories are reverently inscribed.',
        },
        {
          id: 'nc-6c-nihility',
          text: 'Observe that pulse and breath are merely fleeting ripples in a boundless silent cosmos.',
          pathAffinity: 'Nihility',
          affinityPoints: 5,
          consequence: 'You monitor the rhythmic heartbeat with quiet, unhurried detachment.',
        },
        {
          id: 'nc-6c-erudition',
          text: 'Calibrate the arterial compliance curve using Navier-Stokes fluid velocity models.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'The cardiac hemodynamic waveform displays with pristine mathematical clarity.',
        },
      ],
      apparatusType: 'sphygmomanometer_arm',
      apparatusParams: {
        systolicMmHg: 120,
        pressureKPa: 16.0,
      },
    },

    // 7. Pascal's Principle
    {
      id: 'prob-7',
      topicId: 'pascal_principle',
      topicNumber: '07',
      topicTitle: "Pascal's Principle: Hydraulic Multiplication",
      chamberName: 'Hydraulic Piston Colonnade',
      narrativeContext:
        'A collapsed blast door weighing 24,000 Newtons blocks the main corridor. An ancient hydraulic jack mechanism connects a small manual input piston to a large lifting ram. You must calculate the minimal input force F₁ required to lift the heavy door.',
      problemStatement:
        'Using Pascal’s Principle (F₁/A₁ = F₂/A₂), determine the input force F₁ needed on a small piston with area A₁ = 0.0050 m² to raise a heavy load F₂ = 24,000 N resting on an output piston with area A₂ = 0.150 m².',
      formula: 'F₁ = F₂ · (A₁ / A₂)',
      variables: {
        'Input Piston Area (A₁)': '0.0050 m²',
        'Output Piston Area (A₂)': '0.150 m²',
        'Load Force to Lift (F₂)': '24,000 N',
      },
      correctValue: 800,
      tolerance: 0.05,
      unit: 'N',
      options: shuffle([
        {
          id: 'opt-7a',
          label: '800 N',
          value: 800,
          explanation: 'Accurate: F₁ = 24,000 N × (0.005 / 0.150) = 24,000 / 30 = 800 N.',
          isCorrect: true,
        },
        {
          id: 'opt-7b',
          label: '24,000 N',
          value: 24000,
          explanation: 'Incorrect: Ignores the hydraulic mechanical advantage provided by area ratio.',
          isCorrect: false,
        },
        {
          id: 'opt-7c',
          label: '160 N',
          value: 160,
          explanation: 'Incorrect: Off by a factor of 5 in area ratio computation.',
          isCorrect: false,
        },
        {
          id: 'opt-7d',
          label: '720,000 N',
          value: 720000,
          explanation: 'Incorrect: Multiplied forces instead of dividing by mechanical advantage.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-7-destruction',
          text: 'Apply maximum hydraulic pressure until the relief valve shrieks, forcing the door open in seconds.',
          pathAffinity: 'Destruction',
          affinityPoints: 5,
          consequence: 'Hydraulic fluid pulses violently as the metal barrier is ripped upwards with raw power.',
        },
        {
          id: 'nc-7-equilibrium',
          text: 'Pump the manual lever steadily, matching the fluid displacement exactly to each millimeter of lift.',
          pathAffinity: 'Equilibrium',
          affinityPoints: 5,
          consequence: 'The heavy door glides upward in pure mechanical balance without a vibration.',
        },
        {
          id: 'nc-7-erudition',
          text: 'Verify the incompressible fluid bulk modulus to confirm zero energy loss across the hydraulic circuit.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'Theoretical efficiency matches physical measurement to three decimal places.',
        },
        {
          id: 'nc-7-hunt',
          text: 'Leverage the 800 N stroke rapidly to open just enough space to slide under without breaking stride.',
          pathAffinity: 'Hunt',
          affinityPoints: 5,
          consequence: 'You slide under the rising steel beam like a phantom, relentlessly pushing onward.',
        },
      ],
      apparatusType: 'pascal_press',
      apparatusParams: {
        a1: 0.005,
        a2: 0.15,
        f2: 24000,
        f1: 800,
      },
    },

    // 8a. Archimedes Principle: Buoyancy Force
    {
      id: 'prob-8a',
      topicId: 'archimedes_buoyancy',
      topicNumber: '08a',
      topicTitle: "Archimedes' Principle: Buoyant Force (F_b = ρ · V · g)",
      chamberName: 'The Submerged Hydro-Basin',
      narrativeContext:
        'A submerged survey probe in a subterranean seawater reservoir is resting on the bottom sediment. To calculate how much buoyant lift force assists the recovery crane, you must evaluate the net upward Archimedes buoyant force.',
      problemStatement:
        'A spherical titanium exploration canister with total submerged volume V = 0.450 m³ is fully submerged in ocean seawater (density ρ = 1,025 kg/m³). Calculate the buoyant force F_b exerted upward on the canister by the water (using g = 9.81 m/s²).',
      formula: 'F_b = ρ_fluid · V_submerged · g',
      variables: {
        'Fluid': 'Seawater',
        'Fluid Density (ρ)': '1,025 kg/m³',
        'Submerged Volume (V)': '0.450 m³',
        'Gravitational Acceleration (g)': '9.81 m/s²',
      },
      correctValue: 4.52,
      tolerance: 0.05,
      unit: 'kN',
      options: shuffle([
        {
          id: 'opt-8a-1',
          label: '4.52 kN',
          value: 4.52,
          explanation: 'Accurate: F_b = 1,025 kg/m³ × 0.450 m³ × 9.81 m/s² = 4,524.9 N ≈ 4.52 kN.',
          isCorrect: true,
        },
        {
          id: 'opt-8a-2',
          label: '0.46 kN',
          value: 0.46,
          explanation: 'Incorrect: Neglected the fluid density scaling factor.',
          isCorrect: false,
        },
        {
          id: 'opt-8a-3',
          label: '9.81 kN',
          value: 9.81,
          explanation: 'Incorrect: Multiplied gravity twice.',
          isCorrect: false,
        },
        {
          id: 'opt-8a-4',
          label: '22.80 kN',
          value: 22.8,
          explanation: 'Incorrect: Used titanium density instead of displaced fluid density.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-8a-abundance',
          text: 'Retrieve the canister gently to preserve the rare bio-luminescent phytoplankton colonies inside.',
          pathAffinity: 'Abundance',
          affinityPoints: 5,
          consequence: 'The glowing micro-organisms continue to pulse with gentle emerald luminescence.',
        },
        {
          id: 'nc-8a-elation',
          text: 'Let the buoyancy propel the canister upward like an underwater missile for a spectacular splash!',
          pathAffinity: 'Elation',
          affinityPoints: 5,
          consequence: 'Water erupts in a shimmering cascade of spray, filling the basin with rainbow mist.',
        },
        {
          id: 'nc-8a-erudition',
          text: 'Verify the hydrostatic center of buoyancy relative to center of gravity for pitch stability.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'The metacentric height calculation confirms unyielding righting moment.',
        },
        {
          id: 'nc-8a-nihility',
          text: 'Watch the canister suspend weightlessly in the dark water, immune to worldly storms.',
          pathAffinity: 'Nihility',
          affinityPoints: 5,
          consequence: 'The calm water ripples softly, reflecting the ancient stone ceiling in silence.',
        },
      ],
      apparatusType: 'buoyancy_tank',
      apparatusParams: {
        volumeSubmerged: 0.45,
        fluidDensity: 1025,
        buoyancyForceKN: 4.52,
      },
    },

    // 8b. Archimedes Principle: Fluid Displacement
    {
      id: 'prob-8b',
      topicId: 'archimedes_displacement',
      topicNumber: '08b',
      topicTitle: "Archimedes' Principle: Fluid Displacement & Submerged Volume",
      chamberName: 'The Eureka Calibration Basin',
      narrativeContext:
        'A graduated immersion tank is used to measure an irregularly shaped high-density platinum thermal shield fragment before installing it into the labyrinth power core. You must compute the fluid displacement volume ΔV upon complete immersion.',
      problemStatement:
        'A solid pure platinum artifact of mass m = 21.45 kg is lowered until fully submerged into a beaker containing pure water (density ρ = 1,000 kg/m³). Given platinum density ρ_pt = 21,450 kg/m³, determine the volume of water displaced ΔV in Liters (where 1 m³ = 1,000 L).',
      formula: 'ΔV = V_object = m / ρ_object',
      variables: {
        'Artifact Mass (m)': '21.45 kg',
        'Platinum Density (ρ_pt)': '21,450 kg/m³',
        'Displaced Liquid': 'Pure Water (1,000 kg/m³)',
      },
      correctValue: 1.0,
      tolerance: 0.05,
      unit: 'Liters',
      options: shuffle([
        {
          id: 'opt-8b-1',
          label: '1.00 Liter',
          value: 1.0,
          explanation: 'Accurate: V = 21.45 kg / 21,450 kg/m³ = 0.001 m³ = 1.000 Liter of displaced water.',
          isCorrect: true,
        },
        {
          id: 'opt-8b-2',
          label: '21.45 Liters',
          value: 21.45,
          explanation: 'Incorrect: Assumed density was 1,000 kg/m³ for the object.',
          isCorrect: false,
        },
        {
          id: 'opt-8b-3',
          label: '0.10 Liters',
          value: 0.1,
          explanation: 'Incorrect: Decimal place conversion error.',
          isCorrect: false,
        },
        {
          id: 'opt-8b-4',
          label: '4.60 Liters',
          value: 4.6,
          explanation: 'Incorrect: Used titanium density instead of platinum density.',
          isCorrect: false,
        },
      ]),
      narrativeChoices: [
        {
          id: 'nc-8b-erudition',
          text: 'Note Archimedes’ ancient insight: the volume of displaced liquid equals the volume of the submerged body.',
          pathAffinity: 'Erudition',
          affinityPoints: 5,
          consequence: 'Eureka! The graduated scale aligns precisely with the meniscus rise.',
        },
        {
          id: 'nc-8b-remembrance',
          text: 'Record the platinum artifact’s displacement in the ancient codex of Syracuse.',
          pathAffinity: 'Remembrance',
          affinityPoints: 5,
          consequence: 'The eternal memory of human inquiry is reaffirmed across millennia.',
        },
        {
          id: 'nc-8b-abundance',
          text: 'Recycle the overflow water directly into the habitat’s emergency drinking water reserve.',
          pathAffinity: 'Abundance',
          affinityPoints: 5,
          consequence: 'Every drop is cherished, nourishing the life support system.',
        },
        {
          id: 'nc-8b-hunt',
          text: 'Snatch the platinum core from the beaker and slot it straight into the final conduit without delay.',
          pathAffinity: 'Hunt',
          affinityPoints: 5,
          consequence: 'The core clicks into the receptacle; the gate unlocks with swift perfection.',
        },
      ],
      apparatusType: 'displacement_beaker',
      apparatusParams: {
        displacedLiters: 1.0,
        initialWaterHeight: 0.5,
        waterRise: 0.1,
        platinumDensity: 21450,
      },
    },
  ];

  return problems;
}
