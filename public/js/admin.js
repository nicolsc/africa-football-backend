function success(msg){
  $('#result').removeClass('error').addClass('success').html(msg).show().fadeOut(3000);
  typeof reset!='undefined' && reset();
}
function error(err){
  var timer=3000;
  var msg = '';
  if (typeof err == 'string'){
    msg = err;
  }
  else{
    msg = 'Error  '+err.status && err.status>0  ? (err.status +' '+err.statusText) : ' request failed';
  }
  $('#result').addClass('error').removeClass('success').html(msg).show();//.fadeOut(timer);
  setTimeout(function(){
    $('#result').html('').hide();
  }, timer);
}

 function newFixture(params){
  $.ajax({type:'POST', url:'/fixtures', data:params, dataType:'json', success:function(result){
      success('Success - Fixture id : '+result.id);
      refresh();
    }, error:function(err){
      error(err.msg);
    }
  });
}
function deleteFixture(id){
  $.ajax({type:'DELETE', url:'/fixtures/'+id, dataType:'json', success:function(result){
      success('Success - '+result.msg);
      refresh();
    }, error:function(err){
      error(err.msg);
    }
  });
}
function editFixture(params){
  $.ajax({type:'PUT', url:'/fixtures/'+params.id, data:params,dataType:'json', success:function(result){
    success('Edit fixture '+result.id);
    refresh();
  }});
}
function newplayer(params){
  $.ajax({type:'POST', url:'/players', data:params, dataType:'json', success:function(result){
      success('Success - player id : '+result.id);
      refresh();
    }, error:function(err){
      error(err.msg);
    }
  });
}
function deleteplayer(id){
  $.ajax({type:'DELETE', url:'/players/'+id, dataType:'json', success:function(result){
      success('Success - '+result.msg);
      refresh();
    }, error:function(err){
      error(err.msg);
    }
  });
}
function editplayer(params){
  $.ajax({type:'PUT', url:'/players/'+params.id, data:params,dataType:'json', success:function(result){
    success('Edit player '+result.id);
    refresh();
  }});
}