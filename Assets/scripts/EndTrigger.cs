using UnityEngine;

public class EndTrigger : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created

    public GameManager gameManager;
 void OnTriggerEnter ()
    {
        gameManager.CompleteLevel();
    }
}
