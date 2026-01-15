# Rapport de Benchmark : Comparaison des Performances de Calcul

**Date :** 15 janvier 2026  
**Objet :** Analyse comparative des performances entre hyperformulaOriginal et hyperformulaDecimal  
**Destinataire :** CTO  

---

## 1. Résumé Exécutif

Ce rapport présente une analyse comparative des performances de calcul entre deux versions de HyperFormula :

| Version | Description |
|---------|-------------|
| **hyperformulaOriginal** | Version originale utilisant directement les nombres JavaScript natifs (IEEE-754 float64) |
| **hyperformulaDecimal** | Version modifiée avec une couche d'abstraction `IPrecisionNumber` permettant de basculer entre précision native et précision arbitraire (decimal.js) |

### Résultats clés

- **hyperformulaDecimal (mode native)** est **équivalent** en performance à hyperformulaOriginal (~3% de différence)
- **hyperformulaDecimal (mode precise)** ajoute un overhead de **+46%** mais garantit une précision exacte pour les calculs financiers
- Le temps de calcul par ligne est de **~2.2 ms** en mode native et **~3.2 ms** en mode precise

---

## 2. Méthodologie du Benchmark

### 2.1 Configuration du test

| Paramètre | Valeur |
|-----------|--------|
| Lignes de données | 300 |
| Colonnes | 300 |
| Cellules de données | 90,000 |
| Lignes de formules | 80 |
| Cellules de formules | 24,000 |
| **Total cellules** | **114,000** |
| Itérations | 5 |
| Seed aléatoire | 12345 (données déterministes) |

### 2.2 Types de données générées

Les données simulent des valeurs financières typiques :

| Type | Exemple | Distribution |
|------|---------|--------------|
| Prix avec centimes | `979.73` | 25% |
| Quantités entières | `8542` | 25% |
| Taux d'intérêt | `0.04523891` | 25% |
| Grands montants | `456789.1234` | 25% |

### 2.3 Types de formules testées

Le benchmark inclut 80 lignes de formules complexes couvrant les cas d'usage courants :

| Lignes | Type de formule | Complexité |
|--------|-----------------|------------|
| 301-302 | SUM, AVERAGE sur colonnes entières | Simple |
| 303 | Chaîne arithmétique (10 termes) | `=(+A*B-C*D+E*F...)/10` |
| 304 | Totaux cumulés horizontaux | Chaîne de dépendances |
| 305 | Cross-colonnes (5 colonnes) | `=(A*B+C*D)/E` |
| 306 | Intérêts composés (3 taux) | `=P*(1+r1)^4*(1+r2)^4*(1+r3)^4` |
| 307 | NPV (5 périodes) | Valeur actuelle nette |
| 308-317 | Cascade profonde | 10 niveaux de dépendances |
| 318 | SUMPRODUCT 3 colonnes | Produit scalaire |
| 319 | MIN/MAX combinés | Statistiques de plages |
| 320-321 | STDEV, VAR | Écart-type et variance |
| 322 | Formule super-imbriquée | `=SQRT(ABS(...+LN(...)))` |
| 323-332 | Propagation matricielle | 5 voisins par cellule |
| 333-342 | Moyennes pondérées | SUMPRODUCT/SUM |
| 343-352 | Polynômes degré 4 | `=a*x^4+b*x^3+c*x^2+d*x+e` |
| 353-362 | Trigonométrie/Exponentielle | `=SIN()*COS()+EXP()+LN()` |
| 363-372 | Agrégations multi-niveaux | Références croisées |
| 373-380 | Super-complexe final | 8 termes multi-références |

---

## 3. Résultats des Tests

### 3.1 Tableau comparatif

| Version | Mode | Temps moyen | Min | Max | Écart-type |
|---------|------|-------------|-----|-----|------------|
| hyperformulaDecimal | Native | **819.30 ms** | 770 ms | 853 ms | 27.08 ms |
| hyperformulaOriginal | Native | **843.49 ms** | 751 ms | 997 ms | 86.10 ms |
| hyperformulaDecimal | Precise | **1,196.97 ms** | 1,090 ms | 1,359 ms | 110.76 ms |

### 3.2 Performance par ligne

| Version | Mode | Temps/ligne (380 lignes) |
|---------|------|--------------------------|
| hyperformulaDecimal | Native | **2.16 ms** |
| hyperformulaOriginal | Native | **2.22 ms** |
| hyperformulaDecimal | Precise | **3.15 ms** |

### 3.3 Performance par cellule

| Version | Mode | Temps/cellule (114,000 cellules) |
|---------|------|----------------------------------|
| hyperformulaDecimal | Native | **7.19 µs** |
| hyperformulaOriginal | Native | **7.40 µs** |
| hyperformulaDecimal | Precise | **10.50 µs** |

### 3.4 Overhead comparatif

| Comparaison | Différence |
|-------------|------------|
| hyperformulaOriginal vs hyperformulaDecimal (native) | **+2.9%** |
| hyperformulaDecimal (precise) vs hyperformulaDecimal (native) | **+46.1%** |

---

## 4. Vérification de la Précision

Un avantage clé du mode "precise" est la précision des calculs financiers.

### Exemple de résultat (cellule A301 = SUM de 300 valeurs)

| Version | Mode | Résultat |
|---------|------|----------|
| hyperformulaOriginal | Native | `149059.26999999996` |
| hyperformulaDecimal | Native | `149059.26999999996` |
| hyperformulaDecimal | Precise | `149059.27` ✅ |

**Observation :** Le mode "precise" élimine les erreurs d'arrondi IEEE-754, ce qui est crucial pour les applications financières où `0.1 + 0.2 = 0.30000000000000004` en JavaScript natif.

---

## 5. Analyse et Recommandations

### 5.1 Points clés

1. **L'abstraction IPrecisionNumber n'ajoute pas d'overhead significatif**
   - hyperformulaDecimal en mode native est aussi performant que hyperformulaOriginal
   - Différence de ~3% dans la marge d'erreur statistique

2. **Le mode precise a un coût de +46%**
   - Acceptable pour les applications financières nécessitant une précision exacte
   - Recommandé pour : comptabilité, facturation, calculs fiscaux

3. **Flexibilité architecturale**
   - hyperformulaDecimal permet de choisir le mode au runtime
   - Possibilité de basculer selon le cas d'usage

### 5.2 Recommandations par cas d'usage

| Cas d'usage | Mode recommandé | Justification |
|-------------|-----------------|---------------|
| Tableaux de bord, analytics | Native | Performance optimale |
| Calculs financiers (facturation, comptabilité) | Precise | Précision exacte requise |
| Simulations scientifiques | Native | Vitesse prioritaire |
| Rapports réglementaires | Precise | Conformité et audit |

### 5.3 Estimation pour volumes de données

| Volume | Native | Precise |
|--------|--------|---------|
| 1,000 lignes | ~2.2 sec | ~3.2 sec |
| 10,000 lignes | ~22 sec | ~32 sec |
| 100,000 lignes | ~3.7 min | ~5.3 min |

---

## 6. Conclusion

L'architecture `IPrecisionNumber` de **hyperformulaDecimal** offre le meilleur des deux mondes :

- ✅ **Performance équivalente** à hyperformulaOriginal en mode native
- ✅ **Précision garantie** disponible via le mode precise (+46% de temps)
- ✅ **Flexibilité** pour choisir le mode selon les besoins métier

**Recommandation finale :** Adopter hyperformulaDecimal comme version de référence, avec le mode "native" par défaut et le mode "precise" pour les calculs financiers critiques.

---

## Annexe : Commandes d'exécution du benchmark

```bash
# hyperformulaDecimal (les deux modes)
cd hyperformulaDecimal
npx ts-node --compiler-options '{"module":"commonjs"}' test/benchmark-comparison.ts

# hyperformulaOriginal
cd hyperformulaOriginal
npx ts-node --compiler-options '{"module":"commonjs"}' test/benchmark-comparison.ts
```

---

*Rapport généré automatiquement - Benchmark déterministe avec seed 12345*
