using UnityEngine;
using UnityEngine.SceneManagement;
public class GameManager : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created

    bool gameHasEnded = false;
    public GameObject completeLevelUI;
    public void EndGame()
    {
        if (gameHasEnded == false)
        {
            gameHasEnded = true;
             Debug.Log("gameOver");
            Restart();
            Invoke("Restart", 2f);
         }
    }
    void Restart ()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }

    public void CompleteLevel()
    {
        completeLevelUI.SetActive(true);
    }

}
