# TODO: Stratégie de vérification complète du Frontend EasyGestion

## Contexte
Problème actuel: Le formulaire d'enregistrement admin ne fonctionne pas (erreur 504 Gateway Timeout). Le proxy entre frontend et backend semble mal configuré dans l'environnement Docker.

## Stratégie de test systématique
Pour éviter de tourner en rond, nous allons tester chaque partie du frontend de manière méthodique, en commençant par les éléments de base et en progressant vers les fonctionnalités complexes.

## TODO List - Vérification Frontend

### 1. Infrastructure et Configuration de Base
- [ ] Vérifier que tous les conteneurs Docker sont démarrés (backend, frontend, db)
- [ ] Tester la connectivité réseau entre conteneurs (ping backend depuis frontend)
- [ ] Vérifier les logs des conteneurs pour erreurs de démarrage
- [ ] Confirmer que les ports sont correctement exposés (3001 pour frontend, 5002 pour backend)

### 2. Configuration Proxy et API
- [ ] Tester le proxy setupProxy.js avec un curl simple vers /api/health
- [ ] Vérifier que axios.defaults.baseURL est correctement défini dans AuthContext
- [ ] Tester chaque endpoint API individuellement avec curl depuis le conteneur frontend
- [ ] Confirmer que CORS est correctement configuré côté backend

### 3. Composants de Base
- [ ] Tester le rendu de base de chaque composant (sans API calls)
- [ ] Vérifier que les routes React Router fonctionnent
- [ ] Tester la navigation entre pages
- [ ] Vérifier que les formulaires s'affichent correctement

### 4. Authentification et Autorisation
- [ ] Tester le composant Login (connexion utilisateur existant)
- [ ] Tester le composant Home (enregistrement admin)
- [ ] Vérifier que les tokens JWT sont stockés/récupérés correctement
- [ ] Tester la protection des routes avec ProtectedRoute

### 5. Dashboard et Fonctionnalités Admin
- [ ] Tester AdminDashboard après connexion réussie
- [ ] Vérifier AnalyticsDashboard
- [ ] Tester la création d'employés (CreateEmployee)
- [ ] Tester la gestion des paquets (PackageManagement)

### 6. Gestion des Données
- [ ] Tester ExpenseManagement
- [ ] Tester ReceiptEntry
- [ ] Tester SalaryViewing
- [ ] Vérifier les appels API pour CRUD operations

### 7. Upload et Médias
- [ ] Tester l'upload de fichiers (logos, etc.)
- [ ] Vérifier que les fichiers sont stockés dans /uploads
- [ ] Tester l'affichage des images uploadées

### 8. Tests d'Intégration
- [ ] Tester un workflow complet: enregistrement → connexion → dashboard → CRUD
- [ ] Vérifier la persistance des données en DB
- [ ] Tester les erreurs et cas limites
- [ ] Performance et temps de réponse

### 9. Tests de Régression
- [ ] Retester tous les composants après corrections
- [ ] Vérifier que les anciennes fonctionnalités marchent toujours
- [ ] Tests cross-browser si nécessaire

## Commandes de Test Utiles

### Tests réseau:
```bash
# Depuis le conteneur frontend
curl http://backend:5000/health
curl http://backend:5000/api/v1/admin/test

# Depuis host
curl http://localhost:3001
curl http://localhost:5002/health
```

### Tests API:
```bash
# Test enregistrement admin
curl -X POST http://localhost:5002/api/v1/admin \
  -F "name=Test Admin" \
  -F "email=test@example.com" \
  -F "siret=12345678901234" \
  -F "phone=+33123456789" \
  -F "password=TestPassword123!"
```

### Logs:
```bash
# Voir logs des conteneurs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

## Priorités
1. **Critique**: Corriger le proxy pour que les API calls passent
2. **Haute**: Tester l'enregistrement admin (problème actuel)
3. **Moyenne**: Vérifier tous les composants un par un
4. **Basse**: Tests de performance et edge cases

## Indicateurs de Progrès
- [ ] Proxy fonctionnel (API calls passent)
- [ ] Enregistrement admin réussi
- [ ] Connexion utilisateur réussie
- [ ] Toutes les pages accessibles
- [ ] Toutes les fonctionnalités CRUD opérationnelles
- [ ] Tests d'intégration passés

## Notes pour éviter les boucles
- Cocher chaque étape terminée dans ce TODO
- Si un problème revient, noter la cause racine et la solution
- Tester une fonctionnalité à la fois, pas tout en même temps
- Documenter les erreurs rencontrées et leurs résolutions
