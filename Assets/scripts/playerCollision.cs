using UnityEngine;

public class playerCollision : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created

    public PlayerMovement movement;
  
    void OnCollisionEnter (Collision collisionInfo)
    {
        if (collisionInfo.collider.tag == "Obstacle")
        {
            
            movement.enabled = false;
            FindObjectOfType<GameManager>().EndGame();
        }
    }
}
