# Test de connexion agent avec PowerShell
Write-Host "Test de connexion agent..." -ForegroundColor Cyan
Write-Host ""

# Test 1: API agent-login
Write-Host "1. Test API agent-login..." -ForegroundColor Yellow

$body = @{
    email    = "agent.test@esignpro.ch"
    password = "test123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/agent-login" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "Connexion reussie !" -ForegroundColor Green
    Write-Host "   - Success: $($response.success)" -ForegroundColor White
    Write-Host "   - User ID: $($response.user.id)" -ForegroundColor White
    Write-Host "   - Email: $($response.user.email)" -ForegroundColor White
    Write-Host "   - Nom: $($response.user.first_name) $($response.user.last_name)" -ForegroundColor White
    Write-Host "   - Rôle: $($response.user.role)" -ForegroundColor White
    Write-Host "   - Agent Code: $($response.user.agent.agent_code)" -ForegroundColor White
    Write-Host "   - Département: $($response.user.agent.department)" -ForegroundColor White
    
    # Vérifier le rôle pour la redirection
    if ($response.user.role -eq "agent") {
        Write-Host "Role correct: 'agent' - Redirection vers /agent" -ForegroundColor Green
    }
    else {
        Write-Host "Role inattendu: $($response.user.role)" -ForegroundColor Yellow
        
        switch ($response.user.role) {
            "admin" { $redirect = "/admin" }
            "client" { $redirect = "/client-dashboard" }
            default { $redirect = "/dashboard" }
        }
        Write-Host "   - Redirection vers: $redirect" -ForegroundColor White
    }
    
}
catch {
    Write-Host "Erreur connexion agent-login:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: API user-login
Write-Host "2. Test API user-login..." -ForegroundColor Yellow

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/user-login" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "Connexion user-login reussie !" -ForegroundColor Green
    Write-Host "   - Success: $($response2.success)" -ForegroundColor White
    Write-Host "   - Rôle: $($response2.user.role)" -ForegroundColor White
    
}
catch {
    Write-Host "Erreur user-login:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test termine !" -ForegroundColor Cyan
