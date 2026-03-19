using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerMovement : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    public Rigidbody rb;
    public float forwardForce = 1000f;
    public float rightForce = 25f;
  
    void Start()
    {
        
    }

    // Update is called once per frame
    void FixedUpdate()
    {
        rb.AddForce(0, 0, forwardForce * Time.deltaTime);

        if( Keyboard.current.dKey.isPressed)
        {
            rb.AddForce(rightForce * Time.deltaTime, 0, 0,ForceMode.VelocityChange);
              
        }
        if (Keyboard.current.aKey.isPressed)
        {
            rb.AddForce(- 25 * Time.deltaTime, 0, 0, ForceMode.VelocityChange);

        }

        if (rb.position.y < -1f)
        {
            FindAnyObjectByType<GameManager>().EndGame();
        }
    }
}
