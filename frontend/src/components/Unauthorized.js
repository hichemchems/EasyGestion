import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1>Accès non autorisé</h1>
      <p>Vous n'avez pas la permission d'accéder à cette page.</p>
      <button onClick={() => navigate('/')} style={styles.button}>
        Retour à l'accueil
      </button>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    marginTop: '100px',
    color: '#b00020',
  },
  button: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Unauthorized;
