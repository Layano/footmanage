/** Note d'attribut sur l'échelle Football Manager (1 = très faible, 20 = elite mondiale). */
export type AttributeRating = number; // contraint 1–20 par validation métier

export interface PhysicalAttributes {
  speed: AttributeRating;        // Vitesse
  acceleration: AttributeRating; // Accélération
  endurance: AttributeRating;    // Endurance
  strength: AttributeRating;     // Force
  agility: AttributeRating;      // Agilité
}

export interface OutfieldTechnicalAttributes {
  shooting: AttributeRating;     // Tir
  passing: AttributeRating;      // Passe
  dribbling: AttributeRating;    // Dribble
  control: AttributeRating;      // Contrôle
  crossing: AttributeRating;     // Centres
  tackling: AttributeRating;     // Tacle
  marking: AttributeRating;      // Marquage
}

export interface GoalkeeperTechnicalAttributes {
  reflexes: AttributeRating;     // Réflexes
  diving: AttributeRating;       // Plongeon
  /** Distribution — utile pour les gardiens modernes, faible poids en calcul global */
  passing: AttributeRating;
  control: AttributeRating;
}

export interface MentalAttributes {
  determination: AttributeRating; // Détermination
  vision: AttributeRating;          // Vision
  composure: AttributeRating;       // Sang-froid
  positioning: AttributeRating;     // Placement
  workRate: AttributeRating;          // Volume de jeu
}

/** Ensemble complet des attributs détaillés d'un joueur de champ. */
export interface OutfieldPlayerAttributes {
  physical: PhysicalAttributes;
  technical: OutfieldTechnicalAttributes;
  mental: MentalAttributes;
}

/** Ensemble complet des attributs détaillés d'un gardien. */
export interface GoalkeeperPlayerAttributes {
  physical: PhysicalAttributes;
  technical: GoalkeeperTechnicalAttributes;
  mental: MentalAttributes;
}

export type PlayerAttributes = OutfieldPlayerAttributes | GoalkeeperPlayerAttributes;

/** Clé d'attribut utilisable dans les matrices de pondération par poste. */
export type AttributeKey =
  | keyof PhysicalAttributes
  | keyof OutfieldTechnicalAttributes
  | keyof GoalkeeperTechnicalAttributes
  | keyof MentalAttributes;
