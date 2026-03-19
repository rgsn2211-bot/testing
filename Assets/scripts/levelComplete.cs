
using UnityEngine;
using UnityEngine.SceneManagement;

public class levelComplete : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
   public void loadMainmenu()
    {
        SceneManager.LoadScene(0);
    }
}
